package com.supmap.data

data class AuthResponse(
    val message: String,
    val token: String,
    val user: UserResponse?
)

data class SignUpRequest(
    val email: String,
    val password: String,
    val name: String
)

data class SignInRequest(
    val email: String,
    val password: String
)

data class GoogleSignInRequest(
    val code: String
)

data class GoogleAuthUrlResponse(
    val message: String,
    val url: String
)

data class AuthResponseSingUp(
    val id: String,
    val email: String,
    val name: String,
    val password: String?,
    val picture: String?,
    val role: String,
    val created_on: String,
    val modified_on: String
)
