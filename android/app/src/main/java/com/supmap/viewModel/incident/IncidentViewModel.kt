package com.supmap.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.supmap.services.incidents.IncidentService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.supmap.data.Incident
import com.supmap.data.IncidentRequest
import com.supmap.viewModel.auth.AuthViewModel
import kotlinx.coroutines.flow.asStateFlow
import retrofit2.HttpException
import java.net.ConnectException
import java.net.SocketTimeoutException

class IncidentViewModel(
    private val incidentService: IncidentService,
    private val authViewModel: AuthViewModel,
) : ViewModel() {

    // Etat de chargement
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Liste des incidents signalés
    private val _reportIncidents = MutableStateFlow<List<Incident>>(emptyList())
    val reportIncidents: StateFlow<List<Incident>> = _reportIncidents

    // Gestion des erreurs
    private val _error = MutableStateFlow<String?>(null)

    // Signale un nouvel incident
    fun reportIncident(type: String, location: LatLng, description: String? = null, iconRes: Int? = null) {
        val apiType = mapIncidentTypeToApi(type)
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                Log.d("IncidentVM", "Début du signalement d'incident: $type")
                Log.d("IncidentVM", "Position: ${location.latitude}, ${location.longitude}")
                Log.d("IncidentVM", "Description: ${description ?: "Aucune"}")
                Log.d("IncidentVM", "IconRes: ${iconRes?.toString() ?: "Aucun"}")

                // Vérification du token et de l'userId
                val token = authViewModel.userToken.value ?: throw Exception("Not authenticated").also {
                    Log.e("IncidentVM", "Erreur d'authentification: Token non disponible")
                }
                val userId = authViewModel.getCurrentUserId() ?: throw Exception("User ID not available")
                Log.d("IncidentVM", "Token récupéré (${token.take(5)}...), UserId: $userId")

                // Préparation de la requête
                val request = IncidentRequest(
                    type = apiType,
                    location = listOf(location.longitude, location.latitude),
                    description = description
                )

                // Appel API
                Log.d("IncidentVM", "Envoi de la requête à l'API...")
                val response = incidentService.reportUserIncident(
                    userId = userId,
                    request = request,
                    authToken = "Bearer $token"
                )
                Log.d("IncidentVM", "Réponse reçue - Code: ${response.code()}")

                val responseBody = response.body() ?: throw Exception("Réponse vide")
                val serverIncidentId = responseBody.id

                // Gestion de la réponse
                if (!response.isSuccessful) {
                    val errorBody = response.errorBody()?.string() ?: "Pas de détail"
                    Log.e("IncidentVM", "Erreur API - Code: ${response.code()}, Message: ${response.message()}")
                    Log.e("IncidentVM", "Body d'erreur: $errorBody")
                    throw Exception("Échec du signalement. Code: ${response.code()}, Détails: $errorBody")
                }

                // Mise à jour de l'état local
                _reportIncidents.value += Incident(
                    id = serverIncidentId,
                    type = type,
                    location = location,
                    iconRes = iconRes,
                    severity = "medium",
                    description = description ?: "No description provided",
                    timestamp = System.currentTimeMillis()
                )
                Log.d("IncidentVM", "Incident signalé avec succès!")

            } catch (e: SocketTimeoutException) {
                Log.e("IncidentVM", "Timeout: ${e.message}")
                _error.value = "Timeout - Vérifiez votre connexion"
            } catch (e: ConnectException) {
                Log.e("IncidentVM", "Connexion impossible: ${e.message}")
                _error.value = "Impossible de se connecter au serveur"
            } catch (e: HttpException) {
                Log.e("IncidentVM", "Erreur HTTP: ${e.code()}", e)
                _error.value = "Erreur serveur (${e.code()})"
            } catch (e: Exception) {
                Log.e("IncidentVM", "Erreur inattendue", e)
                _error.value = "Erreur: ${e.localizedMessage ?: "Inconnue"}"
            } finally {
                Log.d("IncidentVM", "Fin du traitement - isLoading: false")
                _isLoading.value = false
            }
        }
    }

    // Convertit le type d'incident utilisateur en type API
    private fun mapIncidentTypeToApi(incident: String): String {
        return when (incident.lowercase()) {
            "accident" -> "accident"
            "embouteillage" -> "traffic_jam"
            "police" -> "police_control"
            "route fermée" -> "road_closed"
            "obstacle" -> "roadblock"
            else -> {
                Log.e("IncidentVM", "Type d'incident inconnu: $incident")
                throw IllegalArgumentException("Type d'incident non supporté")
            }
        }
    }

    // Fonction qui permet de redimensionner une icône (image) à une taille spécifiée en dp et retourne un BitmapDescriptor.
    fun getScaledIcon(context: Context, iconResId: Int, sizeInDp: Int = 55): BitmapDescriptor {
        val density = context.resources.displayMetrics.density
        val sizeInPx = (sizeInDp * density).toInt()

        val originalBitmap = BitmapFactory.decodeResource(context.resources, iconResId)
        val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, sizeInPx, sizeInPx, false)

        return BitmapDescriptorFactory.fromBitmap(scaledBitmap)
    }
}