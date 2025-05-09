package com.supmap.data

import com.google.gson.annotations.SerializedName

data class UserResponse(
    @SerializedName("_id") val id: String,
    val email: String,
    val name: String,
    val picture: String?
)

data class UserProfile(
    val id: String,
    val email: String,
    val name: String,
    val password: String
)
