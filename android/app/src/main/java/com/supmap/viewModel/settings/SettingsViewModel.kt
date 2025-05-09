package com.supmap.viewModel.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class SettingsViewModel(application: Application) : AndroidViewModel(application) {
    private val prefs = AppPreferences(application)

    private val _avoidTolls = MutableStateFlow(prefs.avoidTolls ?: false)
    val avoidTolls: StateFlow<Boolean> = _avoidTolls

    // Met à jour la préférence "éviter les péages" à la fois en mémoire et dans le stockage persistant
    fun setAvoidTolls(enabled: Boolean) {
        _avoidTolls.value = enabled
        prefs.avoidTolls = enabled
    }
}