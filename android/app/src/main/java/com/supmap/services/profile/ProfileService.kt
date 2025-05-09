package com.supmap.services.profile

import android.util.Log
import com.supmap.data.UserProfile
import com.supmap.data.Result
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.Response

// Interface Retrofit pour la gestion du profil utilisateur
interface ProfileApiService {

    // Récupère les informations du profil de l'utilisateur authentifié
    @GET("auth/me")
    suspend fun getProfile(@Header("Authorization") token: String): Response<UserProfile>

    // Met à jour les informations du profil pour un utilisateur donné
    @PATCH("users/{userId}")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Path("userId") userId: String,
        @Body updateData: Map<String, String>
    ): Response<UserProfile>
}

class ProfileService(private val apiService: ProfileApiService) {

    // Récupère les informations du profil utilisateur à partir d’un token d’authentification
    suspend fun getProfile(token: String): Result<UserProfile> {
        return try {
            Log.d("ProfileService", "Tentative de récupération du profil avec le token : Bearer $token")
            val response = apiService.getProfile("Bearer $token")

            if (response.isSuccessful && response.body() != null) {
                Log.d("ProfileService", "Profil récupéré avec succès")
                Result.Success(response.body()!!)
            } else {
                Log.e("ProfileService", "Échec de la récupération du profil : code ${response.code()}")
                Result.Error("Erreur lors de la récupération du profil : ${response.message()}")
            }
        } catch (e: Exception) {
            Log.e("ProfileService", "Erreur inattendue lors de la récupération du profil", e)
            Result.Error(e.message ?: "Une erreur inconnue est survenue")
        }
    }

    // Met à jour les informations du profil utilisateur
    suspend fun updateProfile(
        token: String,
        userId: String,
        updateData: Map<String, String>
    ): Result<UserProfile> {
        return try {
            Log.d("ProfileService", "Tentative de mise à jour du profil utilisateur $userId avec les données : $updateData")
            val response = apiService.updateProfile("Bearer $token", userId, updateData)

            if (response.isSuccessful) {
                response.body()?.let {
                    Log.d("ProfileService", "Profil mis à jour avec succès : $it")
                    Result.Success(it)
                } ?: run {
                    Log.e("ProfileService", "Réponse réussie mais corps vide")
                    Result.Error("Réponse vide après mise à jour du profil")
                }
            } else {
                val errorBody = response.errorBody()?.string() ?: "Aucun corps d'erreur"
                Log.e("ProfileService", "Échec de la mise à jour : ${response.code()} - $errorBody")
                Result.Error("Erreur ${response.code()} : $errorBody")
            }
        } catch (e: Exception) {
            Log.e("ProfileService", "Exception lors de la mise à jour du profil", e)
            Result.Error(e.message ?: "La mise à jour a échoué")
        }
    }
}
