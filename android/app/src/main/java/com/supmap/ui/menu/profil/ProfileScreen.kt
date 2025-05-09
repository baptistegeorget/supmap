package com.supmap.ui.menu.profil

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.supmap.viewModel.profile.ProfileViewModel
import com.supmap.data.Result
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.data.UserProfile
import com.supmap.viewModel.profil.ProfileViewModelFactory
import com.supmap.R

val customPurple = Color(0xFF6A4C93)
val customOrange = Color(0xFFF15B4E)

private enum class ProfileDialog {
    EMAIL, USERNAME, PASSWORD
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    navController: NavController,
    viewModel: ProfileViewModel = viewModel(
        factory = ProfileViewModelFactory(LocalContext.current)
    ),
    authViewModel: AuthViewModel = viewModel()
) {
    val profileState by viewModel.profileState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isLoggedIn by authViewModel.userToken.collectAsState()

    // États pour les dialogues
    var activeDialog by remember { mutableStateOf<ProfileDialog?>(null) }
    var editedValue by remember { mutableStateOf("") }

    // Si l'utilisateur n'est pas connecté, on affiche un message
    if (isLoggedIn == null) {
        Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Veuillez vous connecter pour accéder au profil", color = Color.Red)
        }
        return
    }

    // Affichage du loader si les données sont en cours de chargement
    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    // Charge le profil dès que l'utilisateur est connecté
    LaunchedEffect(isLoggedIn) {
        isLoggedIn?.let {
            viewModel.fetchProfile(it)
        }
    }

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
            Spacer(modifier = Modifier.height(20.dp))

            // Affichage du Logo
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "Logo",
                modifier = Modifier.size(140.dp),
                contentScale = ContentScale.Fit
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Carte de profil
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFFD9D9D9)
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Profil",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = customOrange,
                        modifier = Modifier.padding(start = 16.dp, bottom = 4.dp)
                    )

                    Divider(color = customOrange, thickness = 1.dp)

                    Spacer(modifier = Modifier.height(16.dp))

                    // Si le profil est correctement chargé
                    when (profileState) {
                        is Result.Success -> {
                            val profile = (profileState as Result.Success<UserProfile>).data

                            // Vérification des champs avant affichage
                            ProfileFieldList(
                                profile = profile,
                                onFieldSelected = { field ->
                                    activeDialog = field
                                    when (field) {
                                        ProfileDialog.EMAIL -> editedValue =
                                            profile.email ?: "Email non disponible"

                                        ProfileDialog.USERNAME -> editedValue =
                                            profile.name ?: "Nom d'utilisateur non disponible"

                                        ProfileDialog.PASSWORD -> editedValue = ""
                                    }
                                }
                            )
                        }

                        is Result.Error -> {
                            Text(
                                text = "Erreur de chargement du profil",
                                color = Color.Red,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        null -> {
                            // Cas où l'utilisateur n'est pas connecté
                            Column {
                                ProfileFieldItem(
                                    label = "Email",
                                    value = "Veuillez vous connecter",
                                    onClick = {}
                                )
                                ProfileFieldItem(
                                    label = "Nom d'utilisateur",
                                    value = "Veuillez vous connecter",
                                    onClick = {}
                                )
                                ProfileFieldItem(
                                    label = "Mot de passe",
                                    value = "Veuillez vous connecter",
                                    onClick = {}
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Gestion des dialogues pour l'édition
    when (activeDialog) {
        ProfileDialog.EMAIL -> ProfileEditDialog(
            title = "Adresse email",
            currentValue = editedValue,
            isSecure = false,
            onDismiss = { activeDialog = null },
            onSave = { newValue ->
                viewModel.updateEmail(newValue)
                activeDialog = null
            }
        )

        ProfileDialog.USERNAME -> ProfileEditDialog(
            title = "Nom d'utilisateur",
            currentValue = editedValue,
            isSecure = false,
            onDismiss = { activeDialog = null },
            onSave = { newValue ->
                viewModel.updateUsername(newValue)
                activeDialog = null
            }
        )

        ProfileDialog.PASSWORD -> PasswordEditDialog(
            onDismiss = { activeDialog = null },
            onSave = { oldPwd, newPwd ->
                viewModel.updatePassword(oldPwd, newPwd)
                activeDialog = null
            }
        )

        null -> Unit
    }
}

// Composant pour l'édition du mot de passe
@Composable
private fun PasswordEditDialog(
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit
) {
    var oldPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Modifier le mot de passe")
        },
        text = {
            Column {
                // Champ pour l'ancien mot de passe
                OutlinedTextField(
                    value = oldPassword,
                    onValueChange = { oldPassword = it },
                    label = { Text("Ancien mot de passe") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                // Champ pour le nouveau mot de passe
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("Nouveau mot de passe") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                // Champ pour confirmer le nouveau mot de passe
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirmer le mot de passe") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
                // Affichage d'un message d'erreur si nécessaire
                errorMessage?.let {
                    Text(it, color = Color.Red)
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    // Validation des mots de passe avant la sauvegarde
                    if (newPassword != confirmPassword) {
                        errorMessage = "Les mots de passe ne correspondent pas"
                        return@TextButton
                    }
                    if (newPassword.length <= 12) {
                        errorMessage = "Le mot de passe doit contenir au moins 12 caractères"
                        return@TextButton
                    }
                    onSave(oldPassword, newPassword) // Sauvegarde du mot de passe
                },
                colors = ButtonDefaults.textButtonColors(
                    contentColor = customPurple
                )
            ) {
                Text("Enregistrer")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss, // Fermer le dialogue
                colors = ButtonDefaults.textButtonColors(
                    contentColor = customOrange
                )
            ) {
                Text("Annuler")
            }
        },
        containerColor = Color.White
    )
}

// Liste des champs du profil (Email, Nom d'utilisateur, Mot de passe)
@Composable
private fun ProfileFieldList(
    profile: UserProfile,
    onFieldSelected: (ProfileDialog) -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        ProfileFieldItem(
            label = "Email",
            value = profile.email ?: "Email non disponible",
            onClick = { onFieldSelected(ProfileDialog.EMAIL) }
        )

        ProfileFieldItem(
            label = "Nom d'utilisateur",
            value = profile.name ?: "Nom d'utilisateur non disponible",
            onClick = { onFieldSelected(ProfileDialog.USERNAME) }
        )

        ProfileFieldItem(
            label = "Mot de passe",
            value = profile.password ?: "*******",
            onClick = { onFieldSelected(ProfileDialog.PASSWORD) }
        )
    }
}

// Item individuel pour afficher un champ de profil (comme Email, Nom d'utilisateur, Mot de passe)
@Composable
private fun ProfileFieldItem(
    label: String,
    value: String?,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick, // Appeler la fonction onClick lorsque l'item est sélectionné
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.SemiBold
                    )
                )
                Text(
                    text = value ?: "Non renseigné",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Color.Gray
                    )
                )
            }

            Icon(
                imageVector = Icons.Default.KeyboardArrowRight,
                contentDescription = "Modifier",
                tint = Color.Gray
            )
        }
    }
}

// Dialogue permettant à l'utilisateur de modifier un champ du profil (Email, Nom d'utilisateur, etc.)
@Composable
private fun ProfileEditDialog(
    title: String,
    currentValue: String,
    isSecure: Boolean,
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var editedValue by remember { mutableStateOf(currentValue) }

    AlertDialog(
        onDismissRequest = onDismiss, // Fonction pour fermer le dialogue
        title = {
            Text(
                text = "Modifier le $title",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold
                )
            )
        },
        text = {
            OutlinedTextField(
                value = editedValue ?: "",
                onValueChange = { editedValue = it },
                visualTransformation = if (isSecure) PasswordVisualTransformation() else VisualTransformation.None,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(8.dp)
            )
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (editedValue.isNotBlank()) {
                        // Sauvegarder la nouvelle valeur
                        onSave(editedValue)
                    }
                },
                colors = ButtonDefaults.textButtonColors(
                    contentColor = customPurple
                )
            ) {
                Text("Enregistrer")
            }
        },
        dismissButton = {
            TextButton(
                // Fermer le dialogue sans sauvegarder
                onClick = onDismiss,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = customOrange

                )
            ) {
                Text("Annuler")
            }
        },
        containerColor = Color.White
    )
}