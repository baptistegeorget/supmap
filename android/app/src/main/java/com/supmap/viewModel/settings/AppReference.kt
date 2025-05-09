package com.supmap.viewModel.settings

import android.content.Context

class AppPreferences(context: Context) {
    private val sharedPref = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    // Propriété pour lire ou écrire la préférence "éviter les péages"
    var avoidTolls: Boolean
        get() = sharedPref.getBoolean("avoid_tolls", false)
        set(value) = sharedPref.edit().putBoolean("avoid_tolls", value).apply()
}