package com.supmap.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.supmap.ui.auth.AuthScreen
import com.supmap.ui.map.MapScreen
import com.supmap.ui.menu.MenuScreen
import com.supmap.ui.menu.profil.ProfileScreen
import com.supmap.ui.menu.settings.SettingsScreen

@Composable
fun NavigationScreen(
    routeId: String? = null,
) {
    val navController = rememberNavController()

    NavHost(navController, "mapScreen") {
        composable("mapScreen") {
            MapScreen(
                routeId = routeId,
                navController = navController,
            )
        }
        composable("menuScreen") {
            MenuScreen(navController)
        }
        composable("profileScreen") {
            ProfileScreen(navController)
        }
        composable("settingsScreen") {
            SettingsScreen(navController)
        }
        composable("authScreen") {
            AuthScreen(navController)
        }
    }
}
