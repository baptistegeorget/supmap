package com.supmap.viewModel.auth

import android.app.Activity
import android.util.Log
import androidx.activity.compose.LocalActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supmap.R
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

// Crée et mémorise une instance de GoogleSignInClient configurée
@Composable
fun rememberGoogleSignInClient(activity: Activity): GoogleSignInClient {
    val clientId = activity.getString(R.string.google_client_id)
    Log.d("SignInButton", "Client ID: $clientId")

    val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestIdToken(activity.getString(R.string.google_client_id))
        .requestServerAuthCode(activity.getString(R.string.google_client_id), true)
        .requestEmail()
        .build()

    return remember { GoogleSignIn.getClient(activity, gso) }
}

// Composant bouton de connexion Google avec gestion du résultat
@Composable
fun SignInButton(onSignedIn: (String) -> Unit) {
    val activity = LocalActivity.current
    val signInClient = activity?.let { rememberGoogleSignInClient(it) }
    // Launcher pour gérer le résultat de l'activité de connexion
    val launcher = rememberLauncherForActivityResult(contract = ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                val authCode = account?.serverAuthCode
                authCode?.let { onSignedIn(it) }
            } catch (e: ApiException) {
                Log.w("SignInButton", "Google sign in failed", e)
            }
        } else {
            Log.d("SignInButton", "Result code: ${result.resultCode}")
            result.data?.extras?.keySet()?.forEach { key ->
                Log.d("SignInButton", "Extra: $key = ${result.data?.extras?.get(key)}")
            }
        }
    }

    // Bouton de connexion Google stylisé
    Button(onClick = {
        val signInIntent = signInClient?.signInIntent
        if (signInIntent != null) {
            launcher.launch(signInIntent)
        } else {
            Log.e("SignInButton", "Sign-in intent is null")
        }
    },modifier = Modifier
            .fillMaxWidth()
        .height(60.dp)
        .padding(top = 12.dp),
    shape = RoundedCornerShape(8.dp),
    colors = ButtonDefaults.outlinedButtonColors(
        contentColor = Color.White,
        containerColor = Color(0xFFDC2626)
    ),
    border = BorderStroke(1.dp, Color(0xFFDC2626))
    ) {
        Text(
            text = "Se connecter avec Google",
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
    }
}


