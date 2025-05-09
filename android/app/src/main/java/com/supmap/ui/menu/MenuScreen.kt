package com.supmap.ui.menu

import android.app.Application
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.supmap.R
import com.supmap.services.RetrofitClient
import com.supmap.services.map.GoogleMapService
import com.supmap.services.map.OrientationService
import com.supmap.viewModel.settings.SettingsViewModel
import com.supmap.viewModel.settings.SettingsViewModelFactory
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.viewModel.auth.AuthViewModelFactory
import com.supmap.viewModel.incident.IncidentViewModelFactory
import com.supmap.viewModel.map.MapViewModel
import com.supmap.viewModel.map.MapViewModelFactory
import com.supmap.viewModel.route.RouteViewModel
import com.supmap.viewModel.route.RouteViewModelFactory
import com.supmap.viewmodels.IncidentViewModel

// Couleurs définies
val bgGray100 = Color(0xFFF7F7F7)
val bgGray50  = Color(0xFFE0E0E0)
val customPurple = Color(0xFF6A4C93)
val customOrange = Color(0xFFF15B4E)

@Composable
fun MenuScreen(navController: NavController) {
    val context = LocalContext.current

    // Initialisation des ViewModels nécessaires via des factories
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModelFactory(context.applicationContext as Application))
    val settingsViewModel: SettingsViewModel = viewModel(factory = SettingsViewModelFactory(context.applicationContext as Application))
    val mapService = remember { GoogleMapService(context) }
    val orientationService = remember { OrientationService(context) }
    val mapViewModel: MapViewModel = viewModel(factory = MapViewModelFactory(mapService, orientationService))
    val incidentService = remember { RetrofitClient.incidentService }
    val incidentViewModel: IncidentViewModel = viewModel(
        factory = IncidentViewModelFactory(
            incidentService = incidentService,
            authViewModel = authViewModel
        )
    )
    val routeViewModel: RouteViewModel = viewModel(factory = RouteViewModelFactory(RetrofitClient.searchService, authViewModel, context, mapViewModel, settingsViewModel, incidentViewModel))

    // État de l'interface utilisateur
    var selectedButton by rememberSaveable { mutableStateOf<String?>(null) }
    val isLoggedIn by authViewModel.userToken.collectAsState()
    val userName by authViewModel.userName.collectAsState()
    val modifier = Modifier
        .fillMaxSize()
        .background(bgGray100)
        .clickable(
            interactionSource = remember { MutableInteractionSource() },
            indication = null
        ) {
            selectedButton = null
        }
        .padding(16.dp)

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(20.dp))
            // Affichage du logo
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "Logo SUPMap",
                modifier = Modifier
                    .size(140.dp),
                contentScale = ContentScale.Fit
            )
            Spacer(modifier = Modifier.height(8.dp))

            // Bouton Paramètres
            MenuButton(
                text = "Paramètres",
                icon = Icons.Default.Settings,
                isSelected = selectedButton == "Paramètres",
                onClick = {
                    selectedButton = "Paramètres"
                    navController.navigate("settingsScreen")
                }
            )
            // Bouton Profil (affiché uniquement si l'utilisateur est connecté)
            if (isLoggedIn != null) {
                MenuButton(
                    text = "Profil",
                    icon = Icons.Default.Person,
                    isSelected = selectedButton == "Profil",
                    onClick = {
                        selectedButton = "Profil"
                        navController.navigate("profileScreen")
                    }
                )
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (isLoggedIn != null) {
                // Bouton Déconnexion
                MenuButton(
                    text = userName ?: "Déconnexion",
                    icon = Icons.Default.Logout,
                    isSelected = selectedButton == "Déconnexion",
                    onClick = {
                        selectedButton = "Déconnexion"
                        authViewModel.signOut() // Déconnexion ici
                    }
                )
            } else {
                // Bouton Connexion
                MenuButton(
                    text = "Connexion",
                    icon = Icons.Default.Login,
                    isSelected = selectedButton == "Connexion",
                    onClick = {
                        selectedButton = "Connexion"
                        navController.navigate("authScreen")
                    }
                )
            }
            // Bouton Retour à la carte
            MenuButton(
                text = "Retour à la carte",
                icon = Icons.Default.Map,
                isSelected = selectedButton == "Retour à la carte",
                onClick = {
                    selectedButton = "Retour à la carte"
                    routeViewModel.clearErrors() // Réinitialiser les erreurs de route
                    navController.navigate("mapScreen")
                }
            )
        }
    }
}

// Composant pour les boutons du menu
@Composable
fun MenuButton(
    text: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Définition de la couleur de fond en fonction de l'état
    val containerColor = when {
        isSelected -> Color.Gray.copy(alpha = 0.3f)
        isPressed -> Color.Gray.copy(alpha = 0.15f)
        else -> bgGray50
    }

    // Définition de la couleur du texte en fonction de l'état
    val textColor = when {
        isSelected -> customOrange
        isPressed -> customPurple
        else -> Color(0xFF3D2683)
    }

    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth(0.9f)
            .height(70.dp) // Hauteur fixe
            .padding(vertical = 4.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = textColor
        ),
        shape = MaterialTheme.shapes.medium,
        interactionSource = interactionSource
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Start,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(text, fontSize = 22.sp)
        }
    }
}