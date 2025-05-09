package com.supmap.viewModel.route

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.location.Location
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.supmap.data.CreateRouteRequest
import com.supmap.data.GraphHopperResponse
import com.supmap.data.Instruction
import com.supmap.data.RouteOptionsResponse
import com.supmap.data.RoutePath
import com.supmap.data.RouteResponse
import com.supmap.data.SelectedRouteInfo
import com.supmap.data.SuggestionResponse
import com.supmap.data.SuggestionWithDistance
import com.supmap.services.RetrofitClient
import com.supmap.services.map.GoogleMapService
import com.supmap.services.search.SearchAPIService
import com.supmap.ui.map.decodePolyline
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.viewModel.map.MapViewModel
import com.google.gson.Gson
import com.google.android.gms.maps.model.LatLng
import com.supmap.BuildConfig
import com.supmap.R
import com.supmap.data.Incident
import com.supmap.data.WebSocketLocationUpdate
import com.supmap.data.WebSocketNearIncidents
import com.supmap.viewModel.settings.SettingsViewModel
import com.supmap.viewmodels.IncidentViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.coroutines.cancellation.CancellationException
import kotlin.math.min
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.net.SocketException
import java.time.Instant
import kotlin.math.*

class RouteViewModel(
    private val searchService: SearchAPIService,
    private val authViewModel: AuthViewModel,
    private val appContext: Context,
    private val mapViewModel: MapViewModel,
    private val settings: SettingsViewModel,
    private val incidentViewModel: IncidentViewModel
) : ViewModel() {
    // Configurations
    private val apiKey = BuildConfig.GRAPHHOPPER_API_KEY
    private var updateInterval: Long = 2000L
    private var locationUpdateJob: Job? = null
    private var fromSearchJob: Job? = null
    private var toSearchJob: Job? = null
    private var currentRequestId = 0

    // Suggestions de recherche
    private val _fromSuggestions = MutableStateFlow<List<SuggestionResponse>>(emptyList())
    val fromSuggestions: StateFlow<List<SuggestionResponse>> = _fromSuggestions.asStateFlow()

    private val _toSuggestions = MutableStateFlow<List<SuggestionResponse>>(emptyList())
    val toSuggestions: StateFlow<List<SuggestionResponse>> = _toSuggestions.asStateFlow()

    // Options d'itinéraire
    private val _routeOptions = MutableStateFlow<List<RouteOptionsResponse.RouteOption>>(emptyList())
    val routeOptions: StateFlow<List<RouteOptionsResponse.RouteOption>> = _routeOptions

    // Coordonnées de départ/destination
    val _fromCoords = MutableStateFlow<LatLng?>(null)
    val fromCoords: StateFlow<LatLng?> = _fromCoords.asStateFlow()

    private val _toCoords = MutableStateFlow<LatLng?>(null)
    val toCoords: StateFlow<LatLng?> = _toCoords.asStateFlow()

    // Etats de chargement et erreurs
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _routeError = MutableStateFlow<String?>(null)
    val routeError: StateFlow<String?> = _routeError.asStateFlow()

    private val _suggestionError = MutableStateFlow<String?>(null)
    val suggestionError: StateFlow<String?> = _suggestionError.asStateFlow()

    // Navigation
    private val _nextInstruction = MutableStateFlow<Instruction?>(null)
    val nextInstruction: StateFlow<Instruction?> = _nextInstruction.asStateFlow()

    private val _distanceToNextTurn = MutableStateFlow(0.0)
    val distanceToNextTurn: StateFlow<Double> = _distanceToNextTurn.asStateFlow()

    private val _timeToArrival = MutableStateFlow(0L)

    private val _selectedRoute = MutableStateFlow<GraphHopperResponse?>(null)
    val selectedRoute: StateFlow<GraphHopperResponse?> = _selectedRoute.asStateFlow()

    private val _selectedRouteInfo = MutableStateFlow<SelectedRouteInfo?>(null)
    val selectedRouteInfo: StateFlow<SelectedRouteInfo?> = _selectedRouteInfo.asStateFlow()

    private val _suggestionsLoading = MutableStateFlow(false)
    val suggestionsLoading: StateFlow<Boolean> = _suggestionsLoading

    private val _routeOptionsLoading = MutableStateFlow(false)
    val routeOptionsLoading: StateFlow<Boolean> = _routeOptionsLoading


    // Requêtes de recherche
    private val _fromQuery = MutableStateFlow("")
    private val _toQuery = MutableStateFlow("")

    // WebSocket et navigation
    private var sendPositionJob: Job? = null
    private val _routeAffichage = MutableStateFlow<GraphHopperResponse?>(null)
    val _currentPosition = MutableStateFlow<LatLng?>(null)
    private val _isRealNavigation = MutableStateFlow(false)
    private val _shouldReconnect = MutableStateFlow(true)
    private var webSocket: WebSocket? = null
    private val gson = Gson()
    private var routeId: String? = null
    private var pathIndex: Int = 0
    private var reconnectAttempts = 0
    private val MAX_RECONNECT_ATTEMPTS = 5
    private val INITIAL_RECONNECT_DELAY_MS = 1000L
    private val MAX_RECONNECT_DELAY_MS = 30000L
    private var currentInstructionStartTime: Long = 0L
    private var currentInstructionIndex: Int = -1


    // Initialisation
    init {
        viewModelScope.launch {
            // Observer la position utilisateur depuis MapViewModel
            mapViewModel.userLocation.collect { location ->
                location?.let {
                    _currentPosition.value = it
                    Log.d("Navigation", "Position mise à jour depuis MapViewModel: $it")
                }
            }
        }
    }

    // Met à jour la requête de recherche pour le point de départ
    fun updateFromQuery(query: String) {
        _fromQuery.value = query
        if (query.length >= 3) {
            fromSearchJob?.cancel()
            fromSearchJob = viewModelScope.launch {
                _suggestionsLoading.value = true
                delay(300) // Anti-rebond
                fetchSuggestions(query, true)
                _suggestionsLoading.value = false
            }
        } else {
            _fromSuggestions.value = emptyList()
            _suggestionError.value = null
            _suggestionsLoading.value = false
        }
    }

    // Met à jour la requête de recherche pour le point de d'arriver
    fun updateToQuery(query: String) {
        _toQuery.value = query
        if (query.length >= 3) {
            toSearchJob?.cancel()
            toSearchJob = viewModelScope.launch {
                _suggestionsLoading.value = true
                delay(300)
                fetchSuggestions(query, false)
                _suggestionsLoading.value = false
            }
        } else {
            _toSuggestions.value = emptyList()
            _suggestionError.value = null
            _suggestionsLoading.value = false
        }
    }

    // Récupère les suggestions d'adresse depuis l'API
    suspend fun fetchSuggestions(query: String, isFromField: Boolean) {
        try {
            _suggestionError.value = null
            _suggestionsLoading.value = true
            Log.d("SearchAPI", "Fetching suggestions for: $query")
            val response = searchService.getSuggestions(
                query = query,
                limit = 5,
                apiKey = apiKey
            )

            if (response.isSuccessful) {
                val suggestions = response.body()?.hits ?: emptyList()
                if (isFromField) {
                    _fromSuggestions.value = suggestions
                } else {
                    _toSuggestions.value = suggestions
                }
                Log.d("SearchAPI", "Success! ${suggestions.size} suggestions")
            } else {
                val errorMsg = when (response.code()) {
                    400 -> "Requête incorrecte. Vérifiez votre saisie."
                    401 -> "Problème d'authentification. Veuillez réessayer."
                    404 -> "Service indisponible. Veuillez réessayer plus tard."
                    429 -> "Trop de requêtes. Veuillez patienter avant de réessayer."
                    500 -> "Erreur serveur. Veuillez réessayer plus tard."
                    else -> "Erreur lors de la recherche (code ${response.code()})"
                }
                _suggestionError.value = errorMsg
                Log.e("SearchAPI", "Erreur API: $errorMsg")
            }
        } catch (e: Exception) {
            val errorMsg = when (e) {
                is SocketTimeoutException, is TimeoutCancellationException ->
                    "La recherche prend trop de temps. Vérifiez votre connexion internet."
                is UnknownHostException, is IOException ->
                    "Problème de connexion. Vérifiez votre accès internet."
                else ->
                    "Une erreur inattendue est survenue: ${e.localizedMessage ?: "veuillez réessayer"}"
            }
            _suggestionError.value = errorMsg
            Log.e("SearchAPI", "Exception: $errorMsg", e)
        } finally {
            _suggestionsLoading.value = false
        }
    }

    // Sélectionne une suggestion et met à jour les coordonnées correspondantes
    fun selectSuggestion(suggestion: SuggestionResponse, isFromField: Boolean) {
        try {
            val coords = LatLng(suggestion.point.lat, suggestion.point.lng)

            val formattedAddress = buildString {
                suggestion.name?.takeIf { it.isNotBlank() }?.let { append(it) }
                suggestion.housenumber?.takeIf { it.isNotBlank() }?.let { append(" $it") }
                suggestion.postcode?.takeIf { it.isNotBlank() }?.let { append(", $it") }
                suggestion.city?.takeIf { it.isNotBlank() }?.let {
                    if (isNotEmpty()) append(", ")
                    append(it)
                }
            }

            if (formattedAddress.isBlank()) {
                _suggestionError.value = "Adresse invalide. Veuillez en sélectionner une autre"
                return
            }

            if (isFromField) {
                _fromCoords.value = coords
                _fromQuery.value = formattedAddress
                _fromSuggestions.value = emptyList()
            } else {
                _toCoords.value = coords
                _toQuery.value = formattedAddress
                _toSuggestions.value = emptyList()
            } }
        catch (e: Exception) {
            _suggestionError.value = "Erreur lors de la sélection. Veuillez réessayer"
            Log.e("ViewModel", "Error selecting suggestion", e)
        }
    }

    // Calcule la distance en kilomètres entre deux coordonnées géographiques (latitude et longitude)
    fun calculateDistance(
        startLat: Double,
        startLng: Double,
        endLat: Double,
        endLng: Double
    ): Double {
        val results = FloatArray(1)
        Location.distanceBetween(startLat, startLng, endLat, endLng, results)
        return results[0].toDouble() / 1000
    }

    // Récupère les suggestions de lieu avec la distance par rapport à la position actuelle (si disponible)
    fun getSuggestionsWithDistance(): List<SuggestionWithDistance> {
        val currentCoords = _fromCoords.value
        val toSugg = _toSuggestions.value

        Log.d("ViewModel", "fromCoords = $currentCoords")
        Log.d("ViewModel", "toSuggestions size = ${toSugg.size}")

        return if (currentCoords == null) {
            toSugg.map { SuggestionWithDistance(it, 0.0) }
        } else {
            toSugg.map { suggestion ->
                val distance = calculateDistance(
                    startLat = currentCoords.latitude,
                    startLng = currentCoords.longitude,
                    endLat = suggestion.point.lat,
                    endLng = suggestion.point.lng
                )
                SuggestionWithDistance(suggestion, distance)
            }
        }
    }

    // Calcule les options d'itinéraire entre les points sélectionnés
    fun fetchRouteOptions() {
        // Incrémente l'ID de requête pour suivre la dernière demande
        currentRequestId++
        val requestId = currentRequestId
        viewModelScope.launch {
            _routeOptionsLoading.value = true
            _routeError.value = null
            val profile = when {
                settings.avoidTolls.value -> "car_avoid_toll"
                else -> "car"
            }

            try {
                if (requestId != currentRequestId) {
                    return@launch
                }
                // Récupère le point de départ, soit sélectionné, soit via la géolocalisation
                val from = _fromCoords.value ?: getCurrentLocation()?.let { it }
                ?: run {
                    _suggestionError.value = "Veuillez sélectionner un point de départ ou activer la localisation"
                    return@launch
                }

                // Vérifie que le point d’arrivée est bien défini
                val to = _toCoords.value ?: run {
                    _suggestionError.value = "Veuillez sélectionner une destination"
                    return@launch
                }

                // Vérifie que l’utilisateur est connecté (token présent)
                val token = authViewModel.userToken.value ?: run {
                    _suggestionError.value = "Veuillez connecter"
                    return@launch
                }

                // Récupère l’ID utilisateur depuis AuthViewModel
                val userId = authViewModel.getCurrentUserId() ?: run {
                    _suggestionError.value = "Problème de compte. Veuillez vous reconnecter"
                    return@launch
                }

                // Construction de la requête
                val requestBody = CreateRouteRequest(
                    profile = profile,
                    points = listOf(
                        listOf(from.longitude, from.latitude),
                        listOf(to.longitude, to.latitude)
                    )
                )
                Log.d("RouteVM", "Requête complète: $requestBody")

                // Appelle le backend pour créer une route (timeout de 40 secondes)
                val response = withTimeout(40_000) {
                    // Nouveau log pour l'URL complète
                    Log.d("RouteVM", "Endpoint complet: ${RetrofitClient.LOCAL_BASE_URL}users/$userId/routes")

                    RetrofitClient.routeService.createRouteForUser(
                        userId = userId,
                        request = requestBody,
                        authToken = "Bearer $token"
                    )
                }

                val gson = Gson()
                val json = gson.toJson(requestBody)

                if (response.isSuccessful) {
                    Log.d("RouteVM", "Réponse API réussie (code ${response.code()})")

                    // Si l'ID de la requête a changé pendant l'attente de la réponse, on ignore la réponse
                    if (requestId != currentRequestId) {
                        return@launch
                    }

                    val routeResponse = response.body()
                    if (routeResponse == null) {
                        _suggestionError.value = "Aucun itinéraire trouvé. Essayez avec d'autres points"
                        return@launch
                    }

                    val routeId = routeResponse.id
                    Log.d("RouteVM", "Route ID récupéré : $routeId")

                    _routeAffichage.value = routeResponse?.graphhopperResponse

                    // Vérifie que les chemins (paths) sont présents dans la réponse
                    routeResponse.graphhopperResponse?.let { ghResponse ->
                        if (routeResponse.graphhopperResponse?.paths.isNullOrEmpty()) {
                            _suggestionError.value = "Aucun itinéraire disponible entre ces points"
                            return@launch
                        }

                        // Transforme chaque path en option affichable
                        val options = ghResponse.paths?.mapIndexed { index, path ->
                            val duration = path.time ?: 0L
                            val distance = path.distance ?: 0.0

                            RouteOptionsResponse.RouteOption(
                                id = routeId,
                                type = "Itinéraire ${index + 1}",
                                duration = formatDuration(duration),
                                distance = formatDistance(distance),
                                arrivalTime = formatArrival(System.currentTimeMillis() + duration),
                            )
                        } ?: run {
                            Log.w("RouteVM", "Aucun path disponible dans la réponse Graphhopper")
                            emptyList()
                        }

                        _routeOptions.value = options
                    } ?: run {
                        Log.w("RouteVM", "Réponse Graphhopper non trouvée dans la réponse")
                    }
                } else {
                    _suggestionError.value = when (response.code()) {
                        400 -> "Les points sélectionnés ne permettent pas de calculer un itinéraire"
                        401 -> {
                            "Session expirée. Veuillez vous reconnecter"
                        }
                        404 -> "Service d'itinéraires temporairement indisponible"
                        429 -> "Trop de requêtes. Merci de patienter quelques instants"
                        500 -> "Problème technique côté serveur. Notre équipe est prévenue"
                        else -> "Désolé, nous rencontrons un problème technique (code ${response.code()})"
                    }
                }

            } catch (e: Exception) {
                if (requestId == currentRequestId) {
                    _suggestionError.value = when (e) {
                        is TimeoutCancellationException ->
                            "Le calcul prend plus de temps que prévu. Vérifiez vos points ou réessayez"
                        is IOException ->
                            "Problème de connexion. Vérifiez votre accès internet"
                        else ->
                            "Une erreur inattendue s'est produite. Notre équipe a été notifiée"
                    }
                    Log.e("RouteVM", "Erreur technique", e)
                }
            } finally {
                _routeOptionsLoading.value = false
                Log.d("RouteVM", "Fin du calcul d'itinéraire")
            }
        }
    }

    // Nettoie les suggestions de point de départ
    fun clearFromSuggestions() {
        _fromSuggestions.value = emptyList()
    }

    // Récupère la position GPS actuelle via le service de localisation
    private suspend fun getCurrentLocation(): LatLng? {
        return try {
            val googleMapService = GoogleMapService(appContext)
            val location = googleMapService.getCurrentLocation()
            location?.let { LatLng(it.latitude, it.longitude) }
        } catch (e: SecurityException) {
            _suggestionError.value = "Permission de localisation requise"
            null
        } catch (e: Exception) {
            _suggestionError.value = "Impossible d'obtenir votre position. Vérifiez votre GPS"
            null
        }
    }

    // Formate une durée (ms) en texte lisible (ex: "1h30")
    private fun formatDuration(ms: Long): String {
        val minutes = TimeUnit.MILLISECONDS.toMinutes(ms)
        return if (minutes >= 60) {
            val hours = minutes / 60
            val remainingMinutes = minutes % 60
            "${hours}h${remainingMinutes.toString().padStart(2, '0')}"
        } else {
            "${minutes}min"
        }
    }

    // Formate une distance (m) en texte lisible (ex: "3.5 km")
    private fun formatDistance(meters: Double): String {
        return if (meters >= 1000) "%.1f km".format(meters / 1000)
        else "%d m".format(meters.toInt())
    }

    // Formate l'heure d’arrivée à partir du timestamp
    fun formatArrival(timeMillis: Long): String {
        val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        return formatter.format(Date(timeMillis))
    }

    // Met à jour les infos détaillées de l’itinéraire sélectionné
    fun updateSelectedRouteInfo(path: RoutePath,
                                remainingDistance: Double,
                                distanceToNext: Double,
                                remainingTimeMs: Long,
                                eta: String) {
        _selectedRouteInfo.value = SelectedRouteInfo(
            distance = formatDistance(remainingDistance),
            rawDistance = remainingDistance,
            distanceToNext = formatDistance(distanceToNext),
            rawDistanceToNext = distanceToNext,
            duration = formatDurationAsClock(remainingTimeMs),
            arrivalTime = eta,
            currentInstruction = _nextInstruction.value?.text ?: "",
            currentStreet = _nextInstruction.value?.street_name ?: "",
            nextInstructionIndex = 0,
            allInstructions = path.instructions ?: emptyList()
        )
    }

    // Met à jour toutes les informations affichées pour l’itinéraire sélectionné
    fun updateSelectedRouteInfo(path: RoutePath) {
        val defaultDistance = path.distance ?: 0.0
        val defaultTime = path.time ?: 0L
        // Récupère la distance de la première instruction si disponible
        val distanceToNext = path.instructions?.firstOrNull()?.distance ?: defaultDistance
        // Calcule l'heure estimée d’arrivée à partir de maintenant
        val eta = formatArrival(System.currentTimeMillis() + defaultTime)
        // Calculer le temps restant basé sur la distance et le temps
        val remainingTimeMs = defaultTime

        // Appelle la version complète avec toutes les infos
        updateSelectedRouteInfo(
            path = path,
            remainingDistance = defaultDistance,
            distanceToNext = distanceToNext,
            remainingTimeMs = remainingTimeMs,
            eta = eta
        )
    }

    // Convertit une durée en millisecondes au format "hh:mm"
    fun formatDurationAsClock(durationMillis: Long): String {
        val totalMinutes = durationMillis / 60000
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60

        return String.format("%02d:%02d", hours, minutes)
    }

    // Permet de sélectionner un itinéraire parmi ceux proposés en fonction de son index,
    // et met à jour les données associées pour afficher les détails de ce trajet.
    fun selectRoute(index: Int) {
        // Sélectionne un itinéraire parmi ceux proposés (par son index)
        _routeAffichage.value?.paths?.getOrNull(index)?.let { path ->
            Log.d("RouteVM", "Itinéraire sélectionné trouvé - distance: ${path.distance}, time: ${path.time}")
            // Stocke uniquement ce chemin dans les données sélectionnées
            _selectedRoute.value = GraphHopperResponse(paths = listOf(path))
            // Met à jour toutes les infos liées à ce chemin
            updateSelectedRouteInfo(path)
        } ?: run {
            Log.e("RouteVM", "Aucun itinéraire trouvé pour l'index $index")
        }
    }

    // Réinitialise complètement l’état de la carte et de la navigation
    fun resetMapState() {
        _selectedRoute.value = null
        _selectedRouteInfo.value = null
        _fromCoords.value = null
        _toCoords.value = null
        _fromQuery.value = ""
        _toQuery.value = ""
        _fromSuggestions.value = emptyList()
        _toSuggestions.value = emptyList()
        _routeOptions.value = emptyList()
        mapViewModel.clearIncidentMarkers()
        stopNavigation()
        super.onCleared()
    }

    // Inverse les points de départ et d’arrivée
    fun swapFromTo() {
        Log.d("Swap", "Début du swap...")

        // Vérifie que les deux points sont bien définis
        if (_fromCoords.value == null || _toCoords.value == null) {
            _suggestionError.value = when {
                _fromCoords.value == null && _toCoords.value == null ->
                    "Veuillez d'abord sélectionner un départ et une destination"
                _fromCoords.value == null ->
                    "Veuillez d'abord sélectionner un point de départ"
                else ->
                    "Veuillez d'abord sélectionner une destination"
            }
            return
        }

        // Échange les coordonnées et requêtes d’un champ à l’autre
        val tempQuery = _fromQuery.value
        val tempCoords = _fromCoords.value
        val tempSuggestions = _fromSuggestions.value

        _fromQuery.value = _toQuery.value
        _fromCoords.value = _toCoords.value
        _fromSuggestions.value = _toSuggestions.value

        _toQuery.value = tempQuery
        _toCoords.value = tempCoords
        _toSuggestions.value = tempSuggestions

        // Relance le calcul d’itinéraire après l’inversion
        viewModelScope.launch {
            try {
                fetchRouteOptions()
            } catch (e: Exception) {
                _suggestionError.value = e.message ?: "Erreur lors du calcul de l'itinéraire"
            }
        }
    }

    // Démarre les mises à jour en temps réel de la navigation (position, instructions, distance)
    fun startNavigationUpdates(forceStart: Boolean = false) {
        // Active le mode de navigation réelle
        _isRealNavigation.value = true
        Log.d("Navigation", "Démarrage des mises à jour de navigation")
        // Arrêter toute navigation précédente pour éviter les doublons
        stopNavigationUpdates()

        // Lancer une coroutine pour les mises à jour régulières
        locationUpdateJob = viewModelScope.launch {
            Log.d("Navigation", "Coroutine de navigation démarrée")
            while (true) {
                try {
                    Log.v("Navigation", "Début du cycle de mise à jour")
                    updateNavigationData()
                    delay(updateInterval)
                } catch (e: CancellationException) {
                    Log.d("Navigation", "Coroutine annulée normalement")
                    throw e
                } catch (e: Exception) {
                    Log.e("Navigation", "Erreur dans la coroutine de navigation", e)
                }
            }
        }
    }

    // Met à jour les données de navigation
    private suspend fun updateNavigationData() {
        val currentLocation = _currentPosition.value
        val currentRoute = _selectedRoute.value?.paths?.firstOrNull()
        Log.d("Navigation", "Position actuelle récupérée : $currentLocation")

        if (currentLocation == null || currentRoute == null) {
            Log.d("Navigation", "Position actuelle ou route indisponible.")
            return
        }

        val pathPoints = decodePolyline(currentRoute.points)
        if (pathPoints.isEmpty()) {
            Log.e("Navigation", "ERREUR: Aucun point dans le trajet décodé")
            return
        }

        val (closestIndex, nearestPoint) = findNearestPointIndexOnPath(currentLocation, pathPoints)
        val instructions = currentRoute.instructions ?: return

        _distanceToNextTurn.value = calculateDistanceToNextInstruction(
            currentLocation, instructions, pathPoints, closestIndex
        )

        val remainingDistance = calculateRemainingDistanceFromIndex(closestIndex, nearestPoint, pathPoints)
        val newInstructionIndex = findCurrentInstructionIndex(closestIndex, pathPoints, instructions)

        val currentInstruction = instructions[newInstructionIndex]
        val fromIndex = currentInstruction.interval[0]
        val toIndex = currentInstruction.interval[1]

        // Initialisation du temps de début si on change d'instruction
        if (newInstructionIndex != currentInstructionIndex) {
            currentInstructionIndex = newInstructionIndex
            currentInstructionStartTime = System.currentTimeMillis()
            Log.d("Navigation", "Changement d'instruction: index=$currentInstructionIndex")
        }

        val instructionTime = currentInstruction.time?.toLong() ?: 0L

        // Distance totale et déjà parcourue dans l'instruction
        val totalInstructionDistance = calculateRemainingDistanceFromIndex(
            fromIndex, pathPoints[fromIndex], pathPoints.slice(fromIndex..toIndex)
        )

        var alreadyTraveledDistance = calculateRemainingDistanceFromIndex(
            fromIndex, pathPoints[fromIndex], pathPoints.slice(fromIndex..closestIndex)
        )

        val nextIndex = (closestIndex + 1).coerceAtMost(pathPoints.lastIndex)
        val segmentTotal = haversineDistance(pathPoints[closestIndex], pathPoints[nextIndex])
        val segmentTraveled = haversineDistance(pathPoints[closestIndex], currentLocation)
        val interpolatedProgress = (segmentTraveled / segmentTotal).coerceIn(0.0, 1.0)
        alreadyTraveledDistance += interpolatedProgress * segmentTotal

        val distanceRatio = if (totalInstructionDistance > 0) {
            (alreadyTraveledDistance / totalInstructionDistance).coerceIn(0.0, 1.0)
        } else 1.0

        // Calcul du temps déjà écoulé sur l'instruction actuelle
        val elapsedTime = System.currentTimeMillis() - currentInstructionStartTime
        val remainingCurrentInstructionTime = (instructionTime - elapsedTime).coerceAtLeast(0L)

        // Temps total restant : instruction actuelle + instructions suivantes
        var remainingTimeMs = remainingCurrentInstructionTime
        for (i in currentInstructionIndex + 1 until instructions.size) {
            val time = instructions[i].time?.toLong() ?: 0L
            remainingTimeMs += time
        }

        // Mettre à jour le temps estimé d'arrivée
        val roundedMinutes = roundTimeToDisplayMinutes(remainingTimeMs)
        _timeToArrival.value = roundedMinutes.toLong()

        Log.d("Navigation", "Temps restant estimé: ${remainingTimeMs / 1000} s")

        val etaMillis = System.currentTimeMillis() + remainingTimeMs
        val etaFormatted = formatArrival(etaMillis)
        Log.d("Navigation", "Heure estimée d’arrivée: $etaFormatted")

        updateNextInstruction(currentLocation, instructions, pathPoints, closestIndex)

        updateSelectedRouteInfo(
            currentRoute,
            remainingDistance,
            _distanceToNextTurn.value,
            remainingTimeMs,
            etaFormatted
        )
    }

    // Calcule la distance Haversine entre deux points géographiques (LatLng)
    fun haversineDistance(from: LatLng, to: LatLng): Double {
        return haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude)
    }

    // Calcule la distance Haversine entre deux points géographiques définis par leurs latitudes et longitudes
    fun haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val R = 6371000.0 // Rayon de la Terre en mètres
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2.0) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2.0)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    }

    // Estime le temps nécessaire pour parcourir une distance donnée en mètres, en supposant une vitesse moyenne constante
    fun estimateTimeFromDistance(distanceMeters: Double): Long {
        val averageSpeedMetersPerSecond = 10.0 // par exemple 36 km/h
        return (distanceMeters / averageSpeedMetersPerSecond).toLong() * 1000
    }

    // Trouve l'index de l'instruction actuelle à partir de l'index du chemin le plus proche et des instructions disponibles
    private fun findCurrentInstructionIndex(
        closestPathIndex: Int,
        pathPoints: List<LatLng>,
        instructions: List<Instruction>?
    ): Int {
        if (instructions.isNullOrEmpty()) return 0

        for ((index, instruction) in instructions.withIndex()) {
            val fromIndex = instruction.interval[0]
            val toIndex = instruction.interval[1]
            if (closestPathIndex in fromIndex until toIndex) {
                return index
            }
        }

        // Fallback si on est au-delà de toutes les instructions
        val fallbackIndex = instructions.indexOfLast { it.interval[1] < closestPathIndex }
        return if (fallbackIndex != -1) fallbackIndex else 0
    }

    // Arrondit le temps en ms en minutes
    fun roundTimeToDisplayMinutes(timeMs: Long): Int {
        val seconds = timeMs / 1000
        return when {
            seconds < 15 -> 0
            seconds < 60 -> 1
            else -> (seconds / 60).toInt()
        }
    }

    // Arrête les mises à jour de navigation en cours
    fun stopNavigationUpdates() {
        Log.d("Navigation", "Arrêt de la mise à jour de la navigation.")
        locationUpdateJob?.cancel()
        locationUpdateJob = null
    }

    // Calcule la distance restante à parcourir à partir d’un index donné dans le chemin
    private fun calculateRemainingDistanceFromIndex(startIndex: Int, fromPoint: LatLng, path: List<LatLng>): Double {
        // Si l’index est en fin de chemin, il n’y a plus de distance à parcourir
        if (startIndex >= path.size - 1) return 0.0

        // Distance du point actuel jusqu’au prochain point du chemin
        var distance = calculateDistance(fromPoint, path[startIndex + 1])

        // Ajouter les distances entre tous les points restants du chemin
        for (i in (startIndex + 1) until path.size - 1) {
            distance += calculateDistance(path[i], path[i + 1])
        }

        return distance
    }

    // Calcule la distance jusqu'à la prochaine instruction dans le parcours
    private fun calculateDistanceToNextInstruction(
        currentLocation: LatLng,
        instructions: List<Instruction>?,
        pathPoints: List<LatLng>,
        currentPathIndex: Int
    ): Double {
        if (instructions.isNullOrEmpty()) return 0.0

        // Trouver la prochaine instruction pertinente
        val nextInstruction = instructions.firstOrNull { instruction ->
            val interval = instruction.interval ?: return@firstOrNull false
            interval.size >= 2 && interval[1] > currentPathIndex
        } ?: return 0.0

        // Calculer la distance jusqu'au point de l'instruction
        return nextInstruction.interval?.let { interval ->
            val instructionPointIndex = min(interval[1], pathPoints.size - 1)
            calculateDistanceAlongPath(
                currentLocation,
                pathPoints,
                currentPathIndex,
                instructionPointIndex
            )
        } ?: 0.0
    }

    // Calcule la distance totale le long d'un sous-chemin entre deux points donnés dans le parcours
    private fun calculateDistanceAlongPath(
        fromPoint: LatLng,
        path: List<LatLng>,
        startIndex: Int,
        endIndex: Int
    ): Double {
        if (startIndex >= endIndex || endIndex >= path.size) return 0.0

        val subPath = path.subList(startIndex, endIndex + 1)
        val (nearestIndexInSubPath, nearestPoint) = findNearestPointIndexOnPath(fromPoint, subPath)
        val absoluteNearestIndex = startIndex + nearestIndexInSubPath

        // Distance de la position actuelle jusqu’au premier point de chemin
        var distance = calculateDistance(fromPoint, nearestPoint)

        // Ajouter les segments suivants
        for (i in absoluteNearestIndex until endIndex) {
            distance += calculateDistance(path[i], path[i + 1])
        }

        return distance
    }

    // Trouve l'index du segment le plus proche d'un point donné sur le chemin
    private fun findNearestPointIndexOnPath(point: LatLng, path: List<LatLng>): Pair<Int, LatLng> {
        var minDistance = Double.MAX_VALUE      // Distance minimale initialisée au maximum
        var nearestPointIndex = 0               // Index du segment le plus proche
        var nearestPoint = path.first()         // Point projeté le plus proche

        for (i in 0 until path.size - 1) {
            val segmentStart = path[i]
            val segmentEnd = path[i + 1]
            // Calcule le point projeté du point sur ce segment
            val projected = nearestPointOnSegment(point, segmentStart, segmentEnd)
            // Calcule la distance entre le point réel et le point projeté
            val distance = calculateDistance(point, projected)

            // Met à jour si ce segment est le plus proche jusqu'à présent
            if (distance < minDistance) {
                minDistance = distance
                nearestPoint = projected
                nearestPointIndex = i
            }
        }

        Log.d("Navigation", "Point trouvé le plus proche sur le chemin: $nearestPoint à une distance de $minDistance mètres")
        return Pair(nearestPointIndex, nearestPoint)
    }

    // Fonction pour calculer la distance entre deux points LatLng
    private fun calculateDistance(point1: LatLng, point2: LatLng): Double {
        val results = FloatArray(1)
        Location.distanceBetween(
            point1.latitude, point1.longitude,
            point2.latitude, point2.longitude,
            results
        )
        return results[0].toDouble()
    }

    // Trouve le point projeté le plus proche sur un segment (défini par deux LatLng)
    private fun nearestPointOnSegment(point: LatLng, segStart: LatLng, segEnd: LatLng): LatLng {
        if (segStart == segEnd) return segStart

        // Longueur du segment
        val segLength = calculateDistance(segStart, segEnd)
        // Produit scalaire pour trouver la position relative du point sur le segment (valeur entre 0 et 1)
        val t = ((point.latitude - segStart.latitude) * (segEnd.latitude - segStart.latitude) +
                (point.longitude - segStart.longitude) * (segEnd.longitude - segStart.longitude)) /
                (segLength * segLength)

        // Cas où le point projeté est en dehors du segment : on retourne une des extrémités
        return when {
            t < 0 -> segStart
            t > 1 -> segEnd
            // Sinon, calcul de la projection exacte sur le segment
            else -> LatLng(
                segStart.latitude + t * (segEnd.latitude - segStart.latitude),
                segStart.longitude + t * (segEnd.longitude - segStart.longitude)
            )
        }
    }

    // Met à jour l'instruction de navigation suivante en fonction de la position actuelle
    private fun updateNextInstruction(
        currentLocation: LatLng,
        instructions: List<Instruction>?,
        pathPoints: List<LatLng>,
        currentPathIndex: Int
    ) {
        if (instructions.isNullOrEmpty()) {
            Log.d("Navigation", "No instructions available")
            return
        }

        val currentInstructionIndex = instructions.indexOfFirst { instruction ->
            val interval = instruction.interval ?: return@indexOfFirst false
            currentPathIndex in interval[0]..interval[1]
        }

        // Si on trouve une instruction en cours
        if (currentInstructionIndex != -1) {
            val currentInstruction = instructions[currentInstructionIndex]
            val interval = currentInstruction.interval!!

            val endIdx = interval[1].coerceAtMost(pathPoints.lastIndex)
            val remainingSegment = pathPoints.subList(currentPathIndex, endIdx + 1)
            val distanceToEnd = calculateDistanceToSegment(currentLocation, remainingSegment)

            val threshold = 100.0  // peut être dynamique selon le type d'instruction

            // Si on approche de la fin, on affiche la prochaine instruction
            if (distanceToEnd < threshold && currentInstructionIndex + 1 < instructions.size) {
                val nextInstruction = instructions[currentInstructionIndex + 1]
                val nextInterval = nextInstruction.interval!!
                val nextPoint = pathPoints[nextInterval[1].coerceAtMost(pathPoints.lastIndex)]
                val distanceToNext = calculateDistance(currentLocation, nextPoint)

                Log.d("Navigation", "Upcoming: ${nextInstruction.text} (distance: $distanceToNext m)")
                _nextInstruction.value = nextInstruction
            } else {
                Log.d("Navigation", "Current: ${currentInstruction.text} (distance to end: $distanceToEnd m)")
                _nextInstruction.value = currentInstruction
            }
        } else {
            // On est entre deux instructions → choisir la plus proche à venir
            val upcoming = instructions.filter {
                val interval = it.interval ?: return@filter false
                interval[0] > currentPathIndex
            }.minByOrNull {
                val interval = it.interval!!
                val point = pathPoints[interval[0].coerceAtMost(pathPoints.lastIndex)]
                calculateDistance(currentLocation, point)
            }

            if (upcoming != null) {
                Log.d("Navigation", "Fallback next: ${upcoming.text}")
                _nextInstruction.value = upcoming
            }
        }
    }

    // Fonction pour calculer la distance entre un point et un segment
    private fun distanceToSegment(point: LatLng, segStart: LatLng, segEnd: LatLng): Double {
        val nearestPoint = nearestPointOnSegment(point, segStart, segEnd)
        return calculateDistance(point, nearestPoint)
    }

    // Calcule la distance minimale entre un point et une liste de segments consécutifs
    private fun calculateDistanceToSegment(point: LatLng, segment: List<LatLng>): Double {
        var minDistance = Double.MAX_VALUE
        for (i in 0 until segment.size - 1) {
            val distance = distanceToSegment(point, segment[i], segment[i + 1])
            if (distance < minDistance) {
                minDistance = distance
            }
        }
        return minDistance
    }

    // Réinitialise les erreurs liées à l’itinéraire ou suggestions
    fun clearErrors() {
        _suggestionError.value = null
        _routeError.value = null
    }

    // Vérifie si la route démarre à la position actuelle de l’utilisateur
    fun isRouteStartingAtCurrentPosition(): Boolean {
        val currentPosition = _currentPosition.value
        val routeStart = _selectedRoute.value?.paths?.firstOrNull()?.points?.let {
            decodePolyline(it).firstOrNull()
        }

        return currentPosition != null && routeStart != null &&
                currentPosition.isSamePosition(routeStart)
    }

    /*navigation en temps réél*/

    // Fonction pour démarrer la navigation WebSocket
    fun startWebSocketNavigation(routeId: String, pathIndex: Int = 0, forceStart: Boolean = false) {
        // Vérifie que l'utilisateur se trouve au début de l'itinéraire sauf si 'forceStart' est activé
        if (!forceStart && !isRouteStartingAtCurrentPosition()) {
            Log.d("WebSocket", "Itinéraire ne commence pas à la position actuelle")
            return
        }

        this.routeId = routeId
        this.pathIndex = pathIndex

        // Lance une coroutine pour établir la connexion WebSocket
        viewModelScope.launch {
            try {
                // Vérifie si l'utilisateur est connecté
                val userId = authViewModel.getCurrentUserId() ?: run {
                    _routeError.value = "Utilisateur non connecté"
                    return@launch
                }

                // Récupère le token d'authentification
                val token = authViewModel.userToken.value ?: run {
                    _routeError.value = "Token d'authentification manquant"
                    return@launch
                }

                // Construit l'URL WebSocket personnalisée avec l'identifiant utilisateur et de route
                val wsUrl = "${RetrofitClient.WS_BASE_URL}v1/users/$userId/routes/$routeId/navigate?pathIndex=$pathIndex"
                Log.d("WebSocket", "Tentative de connexion à: $wsUrl")

                // Configure le client WebSocket avec des délais raisonnables et des tentatives automatiques
                val client = OkHttpClient.Builder()
                    .pingInterval(30, TimeUnit.SECONDS)
                    .readTimeout(0, TimeUnit.SECONDS)
                    .writeTimeout(10, TimeUnit.SECONDS)
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .retryOnConnectionFailure(true)
                    .build()

                // Crée la requête WebSocket avec le header d'autorisation
                val request = Request.Builder()
                    .url(wsUrl)
                    .addHeader("Authorization", "Bearer $token")
                    .build()

                // Établit la connexion WebSocket avec le serveur et définit les callbacks
                webSocket = client.newWebSocket(request, object : WebSocketListener() {
                    // Callback: connexion établie
                    override fun onOpen(webSocket: WebSocket, response: Response) {
                        Log.d("WebSocket", "Connexion établie")
                        startNavigationUpdates(forceStart = true)
                        startSendingPositionRegularly(webSocket)
                    }
                    // Callback: message reçu depuis le serveur
                    override fun onMessage(webSocket: WebSocket, text: String) {
                        try {
                            Log.d("WebSocket", "Message reçu: $text")
                            handleWebSocketMessage(text)
                        } catch (e: Exception) {
                            Log.e("WebSocket", "Erreur traitement message", e)
                        }
                    }
                    // Callback: connexion fermée proprement
                    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                        Log.d("WebSocket", "Connexion fermée: $reason")
                        stopNavigationUpdates()
                    }
                    // Callback: échec de la connexion ou erreur réseau
                    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                        if (t is SocketException && t.message == "Socket closed") {
                            // Connexion fermée normalement : ne pas logger une erreur ici
                            Log.i("WebSocket", "Socket fermé proprement.")
                        } else {
                            Log.e("WebSocket", "Erreur connexion", t)
                        }
                        stopNavigationUpdates()
                        reconnectWebSocket(routeId, pathIndex)
                    }
                })
            } catch (e: Exception) {
                Log.e("WebSocket", "Erreur initialisation WebSocket: ${e.message}")
            }
        }
    }

    // Démarre une coroutine qui envoie régulièrement la position de l'utilisateur via WebSocket
    private fun startSendingPositionRegularly(webSocket: WebSocket) {
        // Annule une tâche d'envoi précédente s'il y en a une
        sendPositionJob?.cancel()

        sendPositionJob = viewModelScope.launch {
            while (isActive) {
                try {
                    delay(5000) // Envoi toutes les 5 secondes

                    val currentPosition = _currentPosition.value ?: continue

                    // Vérifie si la file d’envoi WebSocket est surchargée
                    if (webSocket.queueSize() > 5) {
                        Log.w("WebSocket", "File d'attente pleine - reconnexion")
                        reconnectWebSocket(routeId, pathIndex, forceStart = true)
                        break
                    }

                    // Crée un message JSON contenant la position et l’horodatage
                    val jsonMessage = gson.toJson(mapOf(
                        "location" to listOf(currentPosition.longitude, currentPosition.latitude),
                        "timestamp" to System.currentTimeMillis()
                    ))

                    webSocket.send(jsonMessage)
                    Log.v("WebSocket", "Position envoyée")

                } catch (e: Exception) {
                    Log.e("WebSocket", "Erreur envoi position", e)
                    if (e is IOException) {
                        reconnectWebSocket(routeId, pathIndex, forceStart = true)
                        break
                    }
                }
            }
        }
    }

    // Analyse le message reçu via WebSocket et délègue le traitement selon le type de données
    private fun handleWebSocketMessage(message: String) {
        try {
            Log.d("WebSocket", "Message reçu: $message")

            // Déclenche le traitement des incidents proches
            if (message.contains("\"nearIncidents\"")) {
                handleNearIncidents(message)
            }

            // Met à jour l’itinéraire s’il y a une nouvelle réponse GraphHopper
            if (message.contains("\"graphhopper_response\"")) {
                handleRouteUpdate(message)
            }

            // Met à jour la position de l'utilisateur si incluse dans le message
            if (message.contains("\"location\"")) {
                handlePositionUpdate(message)
            }
        } catch (e: Exception) {
            Log.e("WebSocket", "Erreur traitement message", e)
        }
    }

    // Met à jour la position de l'utilisateur à partir d'un message WebSocket
    private fun handlePositionUpdate(message: String) {
        try {
            // Parse les données de localisation depuis le message JSON
            val locationData = gson.fromJson(message, WebSocketLocationUpdate::class.java)

            // Vérifie que la structure contient bien les coordonnées attendues
            if (locationData?.location == null || locationData.location.size < 2) {
                Log.e("WebSocket", "Données de localisation invalides: $message")
                return
            }

            // Met à jour la position actuelle de l'utilisateur
            val latLng = LatLng(locationData.location[1], locationData.location[0])
            _currentPosition.value = latLng
            mapViewModel.updateUserLocation(latLng)
        } catch (e: Exception) {
            Log.e("WebSocket", "Erreur lors du traitement de la position", e)
            reconnectWebSocket(routeId, pathIndex)
        }
    }

    private fun handleRouteUpdate(message: String) {
        // Convertir le message en RouteResponse
        val routeResponse = gson.fromJson(message, RouteResponse::class.java)

        val graphHopperResponse = routeResponse.graphhopperResponse

        if (graphHopperResponse == null) {
            Log.e("WebSocket", "Réponse GraphHopper manquante")
            return
        }

        // Assigner `graphHopperResponse` à `_routeAffichage` et `_selectedRoute`
        _routeAffichage.value = graphHopperResponse
        _selectedRoute.value = graphHopperResponse

        // Accéder à la liste des chemins
        val paths = graphHopperResponse.paths

        // Vérification si `paths` est non null et contient au moins un élément
        if (paths.isNullOrEmpty()) {
            Log.e("WebSocket", "Aucun chemin trouvé dans la réponse")
            return // Retourne si aucun chemin n'est trouvé
        }

        // Si `paths` contient des éléments, traiter le premier
        paths.firstOrNull()?.let { path ->
            // Convertir en votre modèle RoutePath existant
            val routePath = RoutePath(
                distance = path.distance ?: 0.0,
                time = path.time ?: 0L,
                points = path.points ?: "",
                instructions = path.instructions?.map { instruction ->
                    Instruction(
                        text = instruction.text ?: "",
                        distance = instruction.distance ?: 0.0,
                        time = instruction.time ?: 0L,
                        interval = instruction.interval ?: emptyList(),
                        sign = instruction.sign,
                        street_name = instruction.street_name,
                        street_ref = instruction.street_ref
                    )
                }
            )

            updateSelectedRouteInfo(routePath)
            mapViewModel.updateRoute(routePath.points)
        } ?: run {
            Log.e("WebSocket", "Le premier élément du chemin est null")
        }
    }

    // Tente de reconnecter le WebSocket avec une stratégie d'attente exponentielle
    private fun reconnectWebSocket(routeId: String?, pathIndex: Int = 0, forceStart: Boolean = true) {

        if (!_shouldReconnect.value) {
            Log.d("WebSocket", "Reconnexion désactivée (navigation arrêtée)")
            return
        }

        if (routeId == null) return

        viewModelScope.launch {
            try {
                // Limite le nombre total de tentatives pour éviter des boucles infinies
                if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    Log.e("WebSocket", "Connexion perdue - veuillez redémarrer la navigation")
                    return@launch
                }

                reconnectAttempts++
                // Calcule un délai exponentiel pour la prochaine tentative (avec une valeur max)
                val delayTime = minOf(
                    INITIAL_RECONNECT_DELAY_MS * (1 shl (reconnectAttempts - 1)),
                    MAX_RECONNECT_DELAY_MS
                )

                Log.d("WebSocket", "Tentative #$reconnectAttempts dans ${delayTime}ms...")
                delay(delayTime)

                // Ferme proprement l'ancienne connexion avant d'en établir une nouvelle
                webSocket?.close(1000, "Reconnexion")
                webSocket = null

                // Tente une nouvelle connexion WebSocket pour continuer la navigation
                startWebSocketNavigation(routeId, pathIndex, forceStart)

            } catch (e: Exception) {
                Log.e("WebSocket", "Erreur lors de la reconnexion", e)
            }
        }
    }

    // Traite les incidents à proximité reçus via WebSocket et les affiche sur la carte
    private fun handleNearIncidents(message: String) {
        // Parse le message JSON en objet de type WebSocketNearIncidents
        val incidentsResponse = gson.fromJson(message, WebSocketNearIncidents::class.java)
        incidentsResponse.nearIncidents.forEach { incident ->
            // Extrait les coordonnées (lat, lon)
            val position = LatLng(
                incident.location.coordinates[1], // latitude
                incident.location.coordinates[0]  // longitude
            )

            // Crée un objet Incident local à partir des données WebSocket
            val localIncident = Incident(
                id = incident.id,
                type = incident.type,
                location = position,
                iconRes = when (incident.type) {
                    "police_control" -> R.drawable.police
                    "accident" -> R.drawable.accident
                    "traffic_jam" -> R.drawable.embouteillage
                    "road_closed" -> R.drawable.route_fermer
                    "roadblock" -> R.drawable.obstacle
                    else -> null
                },
                severity = "medium",
                description = null,
                timestamp = Instant.parse(incident.created_on).toEpochMilli()
            )

            // Affiche l'incident sur la carte principale
            Handler(Looper.getMainLooper()).post {
                mapViewModel.addIncidentMarker(
                    position = position,
                    type = incident.type,
                    id = incident.id,
                    iconRes = localIncident.iconRes?.let {
                        incidentViewModel.getScaledIcon(appContext, it)
                    }
                )
            }
        }
    }


    // Fonction pour arrêter la navigation
    fun stopNavigation() {
        // Désactiver les reconnexions automatiques
        _shouldReconnect.value = false

        try {
            // Annuler les jobs en cours
            sendPositionJob?.cancel()
            sendPositionJob = null

            // Fermer proprement le WebSocket
            webSocket?.close(1000, "Navigation stopped by user")
            webSocket = null

            // Arrêter les mises à jour de navigation
            stopNavigationUpdates()

            Log.d("Navigation", "Navigation arrêtée proprement")
        } catch (e: Exception) {
            Log.e("Navigation", "Erreur lors de l'arrêt", e)
        } finally {
            // Réinitialiser les compteurs
            reconnectAttempts = 0
        }
    }

    // Convertit une ressource vectorielle en BitmapDescriptor pour l'affichage sur la carte
    fun bitmapDescriptorFromVector(context: Context, vectorResId: Int, sizeInDp: Int = 48): BitmapDescriptor {
        val vectorDrawable = ContextCompat.getDrawable(context, vectorResId)!!
        val density = context.resources.displayMetrics.density
        val sizeInPx = (sizeInDp * density).toInt()

        // Crée un bitmap de taille appropriée et dessine le vecteur dedans
        val bitmap = Bitmap.createBitmap(sizeInPx, sizeInPx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        vectorDrawable.setBounds(0, 0, sizeInPx, sizeInPx)
        vectorDrawable.draw(canvas)

        return BitmapDescriptorFactory.fromBitmap(bitmap)
    }

    // Nouvelle méthode pour charger un itinéraire par son ID
    fun loadRouteById(routeId: String) {
        Log.d("RouteViewModel", "Début de loadRouteById() - routeId: $routeId")
        viewModelScope.launch {
            _isLoading.value = true
            _routeError.value = null
            Log.d("RouteViewModel", "Chargement en cours - isLoading=true")

            try {
                // Vérifie si l'utilisateur est connecté
                val userId = authViewModel.getCurrentUserId() ?: run {
                    val errorMsg = "Utilisateur non connecté"
                    _routeError.value = errorMsg
                    Log.e("RouteViewModel", errorMsg)
                    return@launch
                }
                Log.d("RouteViewModel", "UserId récupéré: $userId")
                // Récupère le token d'authentification
                val token = authViewModel.userToken.value ?: run {
                    val errorMsg = "Token d'authentification manquant"
                    _routeError.value = errorMsg
                    Log.e("RouteViewModel", errorMsg)
                    return@launch
                }

                // Envoie la requête GET pour récupérer la route
                val response = withTimeout(30_000) {
                    RetrofitClient.routeService.getRouteById(
                        userId = userId,
                        routeId = routeId,
                        authToken = "Bearer $token"
                    )
                }
                Log.d("RouteViewModel", "Réponse reçue - Code: ${response.code()}")

                when {
                    response.isSuccessful -> {
                        Log.d("RouteViewModel", "Requête réussie (200-299)")
                        val routeResponse = response.body()

                        if (routeResponse != null) {
                            Log.d("RouteViewModel", "Détails de la route: " +
                                    "ID=${routeResponse.id}, ")
                            _routeAffichage.value = routeResponse.graphhopperResponse
                            Log.d("RouteViewModel", "routeAffichage mis à jour")

                            // Sélectionne automatiquement le premier chemin disponible
                            routeResponse.graphhopperResponse?.paths?.firstOrNull()?.let { path ->
                                Log.d("RouteViewModel", "Path trouvé - " +
                                        "Distance: ${path.distance}m, " +
                                        "Durée: ${path.time}ms, " +
                                        "Points: ${path.points?.take(20)}...")

                                _selectedRoute.value = GraphHopperResponse(paths = listOf(path))
                                Log.d("RouteViewModel", "selectedRoute mis à jour")

                                updateSelectedRouteInfo(path)
                                Log.d("RouteViewModel", "Infos de route mises à jour")
                            } ?: run {
                                Log.w("RouteViewModel", "Aucun path trouvé dans la réponse Graphhopper")
                            }
                        } else {
                            val errorMsg = "Réponse vide du serveur"
                            _routeError.value = errorMsg
                            Log.e("RouteViewModel", errorMsg)
                        }
                    }
                    response.code() == 404 -> {
                        val errorMsg = "Itinéraire introuvable (404)"
                        _routeError.value = errorMsg
                        Log.w("RouteViewModel", errorMsg)

                        // Fallback: calculer un nouvel itinéraire
                        Log.d("RouteViewModel", "Lancement du fallback: fetchRouteOptions()")
                        fetchRouteOptions()
                    }
                    // Erreur générique côté serveur
                    else -> {
                        val errorMsg = "Erreur serveur (${response.code()})"
                        _routeError.value = errorMsg
                        Log.e("RouteViewModel", errorMsg)
                        Log.e("RouteViewModel", "Corps de l'erreur: ${response.errorBody()?.string()}")
                    }
                }
            } catch (e: Exception) {
                val errorMsg = "Erreur réseau: ${e.localizedMessage}"
                _routeError.value = errorMsg
                Log.e("RouteViewModel", errorMsg, e)

                when (e) {
                    is TimeoutCancellationException ->
                        Log.e("RouteViewModel", "Timeout dépassé (30s)")
                    is IOException ->
                        Log.e("RouteViewModel", "Problème de connexion réseau")
                    is CancellationException ->
                        Log.e("RouteViewModel", "Requête annulée")
                    else ->
                        Log.e("RouteViewModel", "Exception inattendue", e)
                }
            } finally {
                _isLoading.value = false
                Log.d("RouteViewModel", "Chargement terminé - isLoading=false")
                Log.d("RouteViewModel", "État final - " +
                        "Erreur: ${_routeError.value}, " +
                        "Route affichée: ${_routeAffichage.value != null}, " +
                        "Route sélectionnée: ${_selectedRoute.value != null}")
            }
        }
        Log.d("RouteViewModel", "Fin de loadRouteById()")
    }

    // Compare deux positions géographiques avec une tolérance de 50 mètres
    private fun LatLng?.isSamePosition(other: LatLng?): Boolean {
        if (this == null || other == null) return false

        val results = FloatArray(1)
        Location.distanceBetween(
            this.latitude, this.longitude,
            other.latitude, other.longitude,
            results
        )

        // Tolérance de 50 mètres
        return results[0] < 50f
    }
}
