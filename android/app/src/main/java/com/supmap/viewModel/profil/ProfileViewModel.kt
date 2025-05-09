package com.supmap.viewModel.profile

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.supmap.data.Result
import com.supmap.data.UserProfile
import com.supmap.services.profile.ProfileService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ProfileViewModel(
    private val profileService: ProfileService,
    context: Context
) : ViewModel() {

    // Stockage local des informations d'authentification
    private val sharedPreferences = context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
    private val token = sharedPreferences.getString("auth_token", null)
    private val userId = sharedPreferences.getString("user_id", null)

    // Etats observables
    private val _profileState = MutableStateFlow<Result<UserProfile>?>(null)
    val profileState: StateFlow<Result<UserProfile>?> = _profileState

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    // Profil utilisateur courant
    val currentUser = MutableStateFlow<UserProfile?>(null)

    // Contrôle pour éviter les requêtes répétées
    private var isProfileFetched = false

    init {
        Log.d("ProfileVM", "Initialisation - Token: ${token?.take(5)}..., UserID: $userId")

        if (!token.isNullOrEmpty() && !userId.isNullOrEmpty()) {
            fetchProfile(token)
        } else {
            val errorMsg = "Token ou ID utilisateur introuvable"
            _errorMessage.value = errorMsg
            Log.e("ProfileVM", errorMsg)
        }
    }

    // Met à jour l'email de l'utilisateur
    fun updateEmail(newEmail: String) = updateField(mapOf("email" to newEmail), "email")
    // Met à jour le nom d'utilisateur
    fun updateUsername(newUsername: String) = updateField(mapOf("name" to newUsername), "nom d'utilisateur")
    // Met à jour le mot de passe
    fun updatePassword(oldPassword: String, newPassword: String) =
        updateField(mapOf("currentPassword" to oldPassword, "password" to newPassword), "mot de passe")

    // Met à jour le mot de passe
    private fun updateField(updateData: Map<String, String>, fieldName: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            // Récupération du token depuis les préférences partagées
            val token = sharedPreferences.getString("auth_token", null)
            if (token.isNullOrEmpty()) {
                _errorMessage.value = "Token d'authentification manquant"
                Log.e("ProfileViewModel", "Token manquant")
                _isLoading.value = false
                return@launch
            }

            // Récupération du profil actuel pour obtenir l'ID utilisateur
            when (val profileResult = profileService.getProfile(token)) {
                is Result.Success -> {
                    val userId = profileResult.data.id
                    Log.d("ProfileViewModel", "UserID récupéré : $userId")

                    // Envoi de la requête de mise à jour
                    when (val updateResult = profileService.updateProfile(token, userId, updateData)) {
                        is Result.Success -> {
                            Log.d("ProfileViewModel", "Mise à jour du $fieldName réussie")
                            // Mise à jour de l'état avec le nouveau résultat
                            _profileState.value = updateResult
                            // Rafraîchissement des données du profil
                            fetchProfile(token)
                            _errorMessage.value = "Mise à jour réussie"
                        }
                        is Result.Error -> {
                            _errorMessage.value = updateResult.message
                            Log.e("ProfileViewModel", "Erreur mise à jour : ${updateResult.message}")
                        }
                    }
                }
                is Result.Error -> {
                    _errorMessage.value = "Erreur récupération profil : ${profileResult.message}"
                    Log.e("ProfileViewModel", "Erreur récupération profil : ${profileResult.message}")
                }
                else -> {
                    _errorMessage.value = "Réponse inattendue lors de la récupération du profil"
                    Log.e("ProfileViewModel", "Réponse inattendue")
                }
            }

            _isLoading.value = false
        }
    }

    // Récupère les informations du profil utilisateur
    fun fetchProfile(token: String) {
        if (isProfileFetched) return

        viewModelScope.launch {
            _isLoading.value = true
            try {
                Log.d("ProfileViewModel", "Fetching profile with token: Bearer $token")
                // Envoi de la requête API
                when (val result = profileService.getProfile(token)) {
                    is Result.Success -> {
                        // Mise à jour des états avec les nouvelles données
                        _profileState.value = result
                        currentUser.value = result.data
                        isProfileFetched = true
                        Log.d("ProfileViewModel", "Profil récupéré : ${result.data}")
                    }
                    is Result.Error -> {
                        _errorMessage.value = result.message
                        Log.e("ProfileViewModel", "Erreur récupération profil : ${result.message}")
                    }
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur lors de la récupération du profil"
                Log.e("ProfileViewModel", "Exception récupération profil : ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }
}
