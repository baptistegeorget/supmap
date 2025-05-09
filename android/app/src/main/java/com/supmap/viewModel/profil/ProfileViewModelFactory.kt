package com.supmap.viewModel.profil

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.supmap.services.RetrofitClient
import com.supmap.services.profile.ProfileService
import com.supmap.viewModel.profile.ProfileViewModel

class ProfileViewModelFactory(
    private val context: Context
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ProfileViewModel::class.java)) {
            val sharedPreferences = context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
            val token = sharedPreferences.getString("auth_token", null)
            val userId = sharedPreferences.getString("user_id", null) ?: ""

            return if (!token.isNullOrEmpty() && userId.isNotEmpty()) {
                ProfileViewModel(
                    profileService = ProfileService(RetrofitClient.profileService),
                    context = context
                ) as T
            } else {
                ProfileViewModel(
                    profileService = ProfileService(RetrofitClient.profileService),
                    context = context
                ) as T
            }
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}