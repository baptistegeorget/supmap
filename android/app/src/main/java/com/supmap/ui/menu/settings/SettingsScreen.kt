package com.supmap.ui.menu.settings

import android.app.Application
import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.supmap.R
import com.supmap.viewModel.settings.SettingsViewModel

val bgGray50  = Color(0xFFE0E0E0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController) {
    val context = LocalContext.current
    val viewModel = remember {
        SettingsViewModel(
            context.applicationContext as Application,
        )
    }

    Log.d("SettingsScreen", "ViewModel: $viewModel")

    // Collecte de l'état du switch "Éviter les péages" depuis le ViewModel
    val avoidTolls by viewModel.avoidTolls.collectAsState()

    // Définition de couleurs personnalisées pour l'interface
    val customPurple = Color(0xFF6A4C93)
    val customOrange = Color(0xFFF15B4E)

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = { navController.navigate("menuScreen") }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", modifier = Modifier.size(30.dp))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(35.dp))
            // Affichage du logo
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "Logo SUPMap",
                modifier = Modifier.size(140.dp),
                contentScale = ContentScale.Fit
            )

            Spacer(modifier = Modifier.height(45.dp))

            // Section des paramètres, avec un fond gris et des bords arrondis
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(bgGray50, MaterialTheme.shapes.medium)
                    .clip(MaterialTheme.shapes.medium)
                    .padding(vertical = 16.dp)
            ) {
                // Titre "Paramètres"
                Text(
                    text = "Paramètres",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = customOrange,
                    modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                )
                Divider(color = customOrange, thickness = 1.dp)

                Spacer(modifier = Modifier.height(8.dp))

                // Composant pour "Éviter les péages"
                SettingToggleItem(
                    text = "Éviter les péages",
                    checked = avoidTolls,  // Valeur du switch (activé ou désactivé)
                    onCheckedChange = { viewModel.setAvoidTolls(it) }, // Mise à jour de l'état
                    activeColor = customPurple,
                    inactiveColor = customOrange
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun SettingToggleItem(
    text: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    activeColor: Color,
    inactiveColor: Color
) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = text,
                fontSize = 16.sp,
                modifier = Modifier.weight(1f)
            )

            // Switch pour activer ou désactiver l'option
            Box(
                modifier = Modifier.size(48.dp, 24.dp),
                contentAlignment = Alignment.Center
            ) {
                Switch(
                    checked = checked, // État actuel du switch
                    onCheckedChange = onCheckedChange,
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = activeColor,
                        uncheckedThumbColor = Color.White,
                        uncheckedTrackColor = inactiveColor,
                        uncheckedBorderColor = Color.Transparent,
                        checkedBorderColor = Color.Transparent
                    ),
                    thumbContent = {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .background(Color.White, CircleShape)
                        )
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
        // Divider pour séparer les éléments
        Divider(
            color = Color.LightGray.copy(alpha = 0.5f),
            thickness = 1.dp,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
    }
}