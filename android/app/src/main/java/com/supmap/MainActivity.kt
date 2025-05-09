package com.supmap

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.supmap.navigation.NavigationScreen
import com.supmap.ui.theme.SupmapmobileTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("MainActivity", "Activity created")
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        Log.d("MainActivity", "New intent received")
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        // Extraction du paramètre 'routeId' de l'URL de l'intent
        val routeId = intent?.data?.getQueryParameter("routeId")
        Log.d("MainActivity", "Received routeId: $routeId")

        // Mise à jour des flags de l'intent pour fermer toutes les activités précédentes
        intent?.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK

        // Définit le contenu de l'écran en utilisant une fonction composable
        setContent {
            SupmapmobileTheme {
                NavigationScreen(routeId = routeId)
            }
        }
    }
}