package com.supmap.ui.auth

import android.app.Application
import android.graphics.Rect
import android.util.Log
import android.view.ViewTreeObserver
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.supmap.data.GoogleSignInRequest
import com.supmap.services.RetrofitClient
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.viewModel.auth.AuthViewModelFactory
import com.supmap.viewModel.auth.SignInButton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.supmap.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    navController: NavController
) {
    // Initialisation du contexte et du ViewModel pour l'authentification
    val context = LocalContext.current
    val viewModel: AuthViewModel =
        viewModel(factory = AuthViewModelFactory(context.applicationContext as Application))

    // Variables d'état pour les champs du formulaire
    var authCode by remember { mutableStateOf<String?>(null) }
    var isLoginMode by remember { mutableStateOf(true) } // Mode de connexion ou d'inscription
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) } // Pour afficher ou masquer le mot de passe

    // Observateurs d'état pour charger l'état de la connexion et les erreurs
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    // Erreurs locales pour chaque champ
    var emailError by remember { mutableStateOf("") }
    var passwordError by remember { mutableStateOf("") }
    var confirmPasswordError by remember { mutableStateOf("") }
    var usernameError by remember { mutableStateOf("") }

    // Fonction de validation des champs avant de tenter la connexion ou l'inscription
    fun validateAndAuthenticate() {
        // Réinitialiser les erreurs
        emailError = ""
        passwordError = ""
        confirmPasswordError = ""
        usernameError = ""

        // Ajouter des logs pour voir les valeurs des champs saisis
        Log.d("AuthDebug", "Username: $username")
        Log.d("AuthDebug", "Email: $email")
        Log.d("AuthDebug", "Password: $password")
        Log.d("AuthDebug", "Confirm Password: $confirmPassword")

        if (isLoginMode) {
            // Validation côté client pour la connexion
            if (email.isBlank() || password.isBlank()) {
                if (email.isBlank()) emailError = "L'email est obligatoire."
                if (password.isBlank()) passwordError = "Le mot de passe est obligatoire."
                return
            }
            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                emailError = "Email invalide."
                return
            }

            // Tentative de connexion
            viewModel.signIn(email, password) {
                Toast.makeText(context, "Connexion réussie !", Toast.LENGTH_SHORT).show()
                navController.navigate("menuScreen")
            }
        } else {
            // Validation côté client pour l'inscription
            if (username.isBlank() || email.isBlank() || password.isBlank() || confirmPassword.isBlank()) {
                if (username.isBlank()) usernameError = "Le nom d'utilisateur est obligatoire."
                if (email.isBlank()) emailError = "L'email est obligatoire."
                if (password.isBlank()) passwordError = "Le mot de passe est obligatoire."
                if (confirmPassword.isBlank()) confirmPasswordError =
                    "La confirmation du mot de passe est obligatoire."
                return
            }

            // Validation des mots de passe
            if (password != confirmPassword) {
                passwordError = "Les mots de passe ne correspondent pas."
                return
            }
            if (password.length <= 12) {
                passwordError = "Le mot de passe doit contenir au moins 12 caractères."
                return
            }

            // Ajout des logs pour l'inscription
            Log.d("AuthDebug", "Tentative d'inscription avec les informations :")
            Log.d("AuthDebug", "Username: $username")
            Log.d("AuthDebug", "Email: $email")
            Log.d("AuthDebug", "Password: $password")

            // Tentative d'inscription
            viewModel.signUp(username, email, password) {
                Toast.makeText(context, "Inscription réussie !", Toast.LENGTH_SHORT).show()
                isLoginMode = true // Bascule vers le mode connexion
            }
        }
    }

    // Interface utilisateur pour l'écran d'authentification
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
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .imePadding()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo
            item {
                Spacer(modifier = Modifier.height(35.dp))
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "Logo SUPMap",
                    modifier = Modifier.size(140.dp),
                    contentScale = ContentScale.Fit
                )
                Spacer(modifier = Modifier.height(if (isLoginMode) 150.dp else 100.dp))
            }

            // Message d'erreur
            if (errorMessage != null) {
                item {
                    Text(
                        text = errorMessage!!,
                        color = Color.Red,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            // Formulaire pour les champs de saisie
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Champ "Nom d'utilisateur" uniquement en mode inscription
                    if (!isLoginMode) {
                        TextField(
                            value = username,
                            onValueChange = { username = it },
                            label = { Text("Nom d'utilisateur") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                                .background(
                                    Color.LightGray.copy(alpha = 0.3f),
                                    RoundedCornerShape(8.dp)
                                ),
                            shape = RoundedCornerShape(8.dp),
                            colors = TextFieldDefaults.textFieldColors(
                                containerColor = Color.Transparent,
                                focusedIndicatorColor = Color(0xFF6A4C93),
                                unfocusedIndicatorColor = Color(0xFF6A4C93)
                            )
                        )
                        if (usernameError.isNotEmpty()) {
                            Text(text = usernameError, color = Color.Red, fontSize = 12.sp)
                        }
                    }
                    // Champ "Email"
                    TextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .background(
                                Color.LightGray.copy(alpha = 0.3f),
                                RoundedCornerShape(8.dp)
                            ),
                        shape = RoundedCornerShape(8.dp),
                        colors = TextFieldDefaults.textFieldColors(
                            containerColor = Color.Transparent,
                            focusedIndicatorColor = Color(0xFF6A4C93),
                            unfocusedIndicatorColor = Color(0xFF6A4C93)
                        )
                    )
                    if (emailError.isNotEmpty()) {
                        Text(text = emailError, color = Color.Red, fontSize = 12.sp)
                    }
                    // Champ "Mot de passe"
                    TextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Mot de passe") },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = if (passwordVisible) "Cacher mot de passe" else "Afficher mot de passe"
                                )
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .background(
                                Color.LightGray.copy(alpha = 0.3f),
                                RoundedCornerShape(8.dp)
                            ),
                        shape = RoundedCornerShape(8.dp),
                        colors = TextFieldDefaults.textFieldColors(
                            containerColor = Color.Transparent,
                            focusedIndicatorColor = Color(0xFF6A4C93),
                            unfocusedIndicatorColor = Color(0xFF6A4C93)
                        )
                    )
                    if (passwordError.isNotEmpty()) {
                        Text(text = passwordError, color = Color.Red, fontSize = 12.sp)
                    }

                    // Champ "Confirmer le mot de passe" uniquement en mode inscription
                    if (!isLoginMode) {
                        TextField(
                            value = confirmPassword,
                            onValueChange = { confirmPassword = it },
                            label = { Text("Confirmer mot de passe") },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            trailingIcon = {
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = if (passwordVisible) "Cacher mot de passe" else "Afficher mot de passe"
                                    )
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                                .background(
                                    Color.LightGray.copy(alpha = 0.3f),
                                    RoundedCornerShape(8.dp)
                                ),
                            shape = RoundedCornerShape(8.dp),
                            colors = TextFieldDefaults.textFieldColors(
                                containerColor = Color.Transparent,
                                focusedIndicatorColor = Color(0xFF6A4C93),
                                unfocusedIndicatorColor = Color(0xFF6A4C93)
                            )
                        )
                        if (confirmPasswordError.isNotEmpty()) {
                            Text(text = confirmPasswordError, color = Color.Red, fontSize = 12.sp)
                        }
                    }
                }
            }

            // Boutons pour se connecter ou s'inscrire, ainsi que pour basculer entre les deux modes
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp)
                        .padding(bottom = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Button(
                        onClick = { validateAndAuthenticate() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3D1D91))
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                        } else {
                            Text(
                                text = if (isLoginMode) "Connexion" else "Inscription",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }

                    // Bouton pour l'authentification via Google (si le mode est connecté)
                    if (isLoginMode) {
                        SignInButton(onSignedIn = { code ->
                            authCode = code
                            CoroutineScope(Dispatchers.IO).launch {
                                val request = GoogleSignInRequest(code)
                                val response = RetrofitClient.api.googleSignInCallback(request)
                            }
                        })
                    }

                    // Lien pour basculer entre connexion et inscription
                    TextButton(
                        onClick = { isLoginMode = !isLoginMode },
                        modifier = Modifier.padding(top = 16.dp)
                    ) {
                        Text(
                            text = if (isLoginMode) "Pas de compte ? S'inscrire" else "Déjà un compte ? Se connecter",
                            color = Color(0xFF3D1D91),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}