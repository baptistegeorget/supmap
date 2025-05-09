package com.supmap.viewModel.auth

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.supmap.data.SignInRequest
import com.supmap.data.SignUpRequest
import com.supmap.services.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.json.JSONException
import java.io.IOException

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    // Context et états initiaux
    private val context: Context = application.applicationContext

    // Etat de chargement
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    // Gestion des erreurs
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    // Stockage des préférences et données utilisateur
    private val sharedPreferences = context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
    private val _userToken = MutableStateFlow<String?>(null)
    val userToken: StateFlow<String?> = _userToken

    private val _userName = MutableStateFlow<String?>(null)
    val userName: StateFlow<String?> = _userName

    init {
        // Récupération des données persistantes au démarrage
        _userToken.value = sharedPreferences.getString("auth_token", null)
        _userName.value = sharedPreferences.getString("user_name", null)
        Log.d("AuthViewModel", "Initialisation - Token: ${_userToken.value?.take(5)}..., Nom: ${_userName.value}")
    }

    // Inscription d'un nouvel utilisateur
    fun signUp(name: String, email: String, password: String, onSuccess: () -> Unit) {
        _isLoading.value = true
        _errorMessage.value = null

        Log.d("AuthViewModel", "Tentative d'inscription pour $email avec le nom $name.")

        // Validation des entrées utilisateur avant de faire la requête réseau
        when {
            // Vérification que le nom n'est pas vide
            name.isBlank() -> {
                _errorMessage.value = "Le nom est requis"
                _isLoading.value = false
                return
            }
            // Vérification de la longueur maximale du nom
            name.length > 32 -> {
                _errorMessage.value = "Le nom ne doit pas dépasser 32 caractères"
                _isLoading.value = false
                return
            }
            // Validation du format de l'email avec une expression régulière
            !email.matches(Regex("^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}\$")) -> {
                _errorMessage.value = "Veuillez entrer une adresse email valide"
                _isLoading.value = false
                return
            }
            // Vérification de la longueur minimale du mot de passe
            password.length < 12 -> {
                _errorMessage.value = "Le mot de passe doit contenir au moins 12 caractères"
                _isLoading.value = false
                return
            }
            // Vérification de la longueur maximale du mot de passe
            password.length > 32 -> {
                _errorMessage.value = "Le mot de passe ne doit pas dépasser 32 caractères"
                _isLoading.value = false
                return
            }
        }

        // Lancement de la coroutine pour la requête réseau
        viewModelScope.launch {
            try {
                // Envoi de la requête d'inscription à l'API
                val response = RetrofitClient.api.signUp(SignUpRequest(email, password, name))

                val raw = response.body()
                Log.d("AuthViewModel", "Réponse brute: $raw")

                if (response.isSuccessful) {
                    if (response.isSuccessful) {
                        val authResponse = response.body()
                        // Vérification que la réponse contient bien un ID utilisateur
                        if (authResponse?.id != null) {
                            // Sauvegarde de l'ID utilisateur et appel du callback de succès
                            saveUserId(authResponse.id)
                            onSuccess()
                            Log.d("AuthViewModel", "Inscription réussie pour $email")
                        } else {
                            _errorMessage.value = "Erreur lors de la création du compte"
                            Log.e("AuthViewModel", "Réponse incomplète: ${response.body()}")
                        }
                    } else {
                        _errorMessage.value = "Erreur : Données de l'utilisateur manquantes"
                        Log.e("AuthViewModel", "Réponse utilisateur invalide")
                    }
                } else {
                    // Traitement des erreurs spécifiques de l'API
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = when {
                        errorBody?.contains("email") == true ->
                            "Cette adresse email est déjà utilisée"
                        errorBody?.contains("password") == true ->
                            "Le mot de passe ne respecte pas les exigences de sécurité"
                        else -> "Erreur lors de l'inscription. Veuillez réessayer"
                    }
                    _errorMessage.value = errorMsg
                    Log.e("AuthViewModel", "Erreur inscription: ${response.code()} - $errorBody")
                }
            } catch (e: Exception) {
                // Gestion des exceptions réseau et autres erreurs inattendues
                val errorMsg = when (e) {
                    is IOException -> "Problème de connexion. Vérifiez votre internet"
                    is JSONException -> "Réponse serveur invalide"
                    else -> "Erreur inattendue: ${e.localizedMessage}"
                }
                _errorMessage.value = errorMsg
                Log.e("AuthViewModel", "Erreur lors de l'inscription : ${e.message}")
            } finally {
                // Quel que soit le résultat, on arrête le chargement
                _isLoading.value = false
            }
        }
    }

    // Connexion d'un utilisateur existant
    fun signIn(email: String, password: String, onSuccess: () -> Unit) {
        _isLoading.value = true
        _errorMessage.value = null
        Log.e("AuthViewModel", "Hello !")
        viewModelScope.launch {
            try {
                // Envoi de la requête de connexion à l'API
                val response = RetrofitClient.api.signIn(SignInRequest(email, password))

                if (response.isSuccessful) {
                    // Extraction du token depuis la réponse
                    response.body()?.token?.let { token ->
                        // Sauvegarde du token et appel du callback de succès
                        saveToken(token)
                        onSuccess()
                        Log.d("AuthViewModel", "Connexion réussie pour $email")
                    } ?: run {
                        _errorMessage.value = "Erreur d'authentification"
                        Log.e("AuthViewModel", "Token manquant dans la réponse")
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMsg = when (response.code()) {
                        401 -> "Email ou mot de passe incorrect"
                        404 -> "Compte non trouvé"
                        400 -> "Requête invalide"
                        else -> "Erreur de connexion. Code: ${response.code()}"
                    }
                    _errorMessage.value = errorMsg
                    Log.e("AuthViewModel", "Erreur connexion: ${response.code()} - $errorBody")
                }
            } catch (e: Exception) {
                // Gestion des exceptions réseau et autres erreurs inattendues
                val errorMsg = when (e) {
                    is IOException -> "Impossible de se connecter au serveur"
                    is JSONException -> "Réponse serveur invalide"
                    else -> "Erreur inattendue: ${e.localizedMessage}"
                }
                _errorMessage.value = errorMsg
                Log.e("AuthViewModel", "Erreur connexion", e)
            } finally {
                // Quel que soit le résultat, on arrête le chargement
                _isLoading.value = false
                Log.d("AuthViewModel", "Processus de connexion terminé")
            }
        }
    }

    // Déconnexion de l'utilisateur
    fun signOut() {
        sharedPreferences.edit().remove("auth_token").apply()
        _userToken.value = null
        Log.d("AuthViewModel", "Utilisateur déconnecté")
    }

    // Méthodes privées de persistance des données
    private fun saveToken(token: String) {
        sharedPreferences.edit()
            .putString("auth_token", token)
            .apply()
        _userToken.value = token
    }

    private fun saveUserId(userId: String) {
        sharedPreferences.edit()
            .putString("user_id", userId)
            .apply()
        Log.d("AuthViewModel", "User ID saved to SharedPreferences: $userId")
    }

    // Récupère le token courant
    fun getCurrentToken(): String? {
        return sharedPreferences.getString("auth_token", null)
    }

    // Récupère l'ID de l'utilisateur courant
    suspend fun getCurrentUserId(): String {
        val token = getCurrentToken()

        if (token.isNullOrEmpty()) {
            throw Exception("Token manquant ou invalide")
        }

        // Formatage du token pour l'authentification Bearer
        val bearerToken = "Bearer $token"

        val response = RetrofitClient.profileService.getProfile(bearerToken)
        if (response.isSuccessful) {
            // Extraction de l'ID utilisateur
            val userId = response.body()?.id
            if (!userId.isNullOrEmpty()) {
                // Sauvegarde de l'ID pour usage futur
                saveUserId(userId)
                return userId
            } else {
                throw Exception("ID utilisateur manquant dans le profil")
            }
        } else {
            throw Exception("Erreur du serveur: ${response.code()} - ${response.message()}")
        }
    }
}