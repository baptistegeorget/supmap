package com.supmap.services.auth

import com.supmap.data.AuthResponse
import com.supmap.data.AuthResponseSingUp
import com.supmap.data.GoogleAuthUrlResponse
import com.supmap.data.GoogleSignInRequest
import com.supmap.data.SignInRequest
import com.supmap.data.SignUpRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

// Interface pour les appels liés à l'authentification
interface AuthApiService {

    // Connexion avec email et mot de passe
    @POST("auth/signin")
    suspend fun signIn(@Body request: SignInRequest): Response<AuthResponse>

    // Création d'un nouveau compte utilisateur
    @POST("users")
    suspend fun signUp(@Body request: SignUpRequest): Response<AuthResponseSingUp>

    // Récupération de l'URL d'authentification Google
    @GET("auth/google")
    suspend fun getGoogleUrl(): Response<GoogleAuthUrlResponse>

    // Callback après l'authentification Google
    @POST("auth/google/callback")
    suspend fun googleSignInCallback(@Body request: GoogleSignInRequest): Response<AuthResponse>
}