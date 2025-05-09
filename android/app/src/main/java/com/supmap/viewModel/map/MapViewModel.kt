package com.supmap.viewModel.map

import android.location.Location
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.supmap.data.GraphHopperResponse
import com.supmap.services.map.GoogleMapService
import com.supmap.services.map.OrientationService
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.supmap.ui.map.decodePolyline
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.atan2

class MapViewModel(private val mapService: GoogleMapService, private val orientationService: OrientationService) : ViewModel() {
    // Etats observables
    private val _userLocation = MutableStateFlow<LatLng?>(null)
    val userLocation: StateFlow<LatLng?> = _userLocation.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _bearing = MutableStateFlow(0f)
    val bearing: StateFlow<Float> = _bearing

    private val _routePoints = MutableStateFlow<String?>(null)
    val routePoints: StateFlow<String?> = _routePoints

    // Etats internes
    private val isTracking = AtomicBoolean(false)
    private val _showPermissionRationale = MutableStateFlow(false)
    private val _currentPathDirection = MutableStateFlow(0f)
    private val _pathPoints = MutableStateFlow<List<LatLng>>(emptyList())
    private val _selectedRoute = MutableStateFlow<GraphHopperResponse?>(null)
    private val _markers = MutableStateFlow<List<Marker>>(emptyList())
    private val _pendingMarkers = mutableListOf<MarkerOptions>()
    private val _incidentMarkers = mutableListOf<Marker>()
    private val _incidentMarkerIds = mutableListOf<String>()

    // Configurations
    private var lastPathUpdateTime = 0L
    private val MIN_UPDATE_INTERVAL = 500
    private var locationCallback: LocationCallback? = null

    init {
        Log.d("MapVM", "Initialisation du ViewModel")
        orientationService.start()
        startTrackingLocation()

        viewModelScope.launch {
            orientationService.orientation.collect { bearing ->
                _bearing.value = bearing
            }
        }
    }

    // Récupère la position actuelle de l'utilisateur
    fun fetchUserLocation() {
        if (_isLoading.value) return

        _isLoading.value = true
        viewModelScope.launch {
            try {
                mapService.getCurrentLocation()?.let { location ->
                    _userLocation.value = location
                    _errorMessage.value = null
                } ?: run {
                    _errorMessage.value = "Impossible d'obtenir la localisation"
                }
            } catch (e: SecurityException) {
                _errorMessage.value = "Permission de localisation requise"
            } catch (e: Exception) {
                _errorMessage.value = "Erreur de localisation: ${e.message ?: "Inconnue"}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    // Active le suivi continu de la position
    fun startTrackingLocation() {
        // Vérifier si on est déjà en train de tracker
        if (isTracking.getAndSet(true)) return

        // Vérifier les permissions avant de démarrer
        if (!mapService.hasLocationPermission()) {
            Log.w("Location", "Les permissions de localisation ne sont pas accordées")
            isTracking.set(false)
            return
        }

        // Démarre les mises à jour de position
        mapService.startLocationUpdates { newLocation ->
            Log.d("Location", "Nouvelle position reçue: $newLocation")
            viewModelScope.launch {
                val latLng = LatLng(newLocation.latitude, newLocation.longitude)
                _userLocation.value = latLng
                Log.d("Location", "_userLocation mis à jour: $latLng")

                // Mettre à jour la direction si un itinéraire est sélectionné
                _selectedRoute.value?.paths?.firstOrNull()?.points?.let { encodedPolyline ->
                    updatePathDirection(latLng, decodePolyline(encodedPolyline))
                } ?: Log.d("Location", "Aucun chemin sélectionné pour calcul du bearing")
            }
        }
    }

    // Met à jour la direction du chemin en fonction de la position
    fun updatePathDirection(userPosition: LatLng, pathPoints: List<LatLng>) {
        // Limiter la fréquence des mises à jour
        val now = System.currentTimeMillis()
        if (now - lastPathUpdateTime < MIN_UPDATE_INTERVAL) {
            Log.d("Bearing", "Trop tôt pour recalculer la direction")
            return
        }
        lastPathUpdateTime = now

        viewModelScope.launch {
            // Vérifier qu'on a suffisamment de points
            if (pathPoints.size < 2) {
                Log.d("Bearing", "Pas assez de points pour calculer une direction")
                return@launch
            }

            var closestSegmentIndex = 0
            var minDistance = Float.MAX_VALUE

            for (i in 0 until pathPoints.size - 1) {
                val distance = distanceToSegment(userPosition, pathPoints[i], pathPoints[i + 1])
                if (distance < minDistance) {
                    minDistance = distance
                    closestSegmentIndex = i
                }
            }

            val start = pathPoints[closestSegmentIndex]
            val end = pathPoints[closestSegmentIndex + 1]
            Log.d("Bearing", "Segment le plus proche: [$start -> $end]")

            val direction = Math.toDegrees(atan2(
                end.longitude - start.longitude,
                end.latitude - start.latitude
            )).toFloat()

            Log.d("Bearing", "Nouvelle direction: $direction°")
            _currentPathDirection.value = direction
        }
    }

    // Calcule la distance entre un point et un segment de ligne
    private fun distanceToSegment(point: LatLng, segStart: LatLng, segEnd: LatLng): Float {
        // Cas où le segment est un point unique
        return if (segStart == segEnd) {
            calculateDistance(point, segStart)
        } else {
            val segLength = calculateDistance(segStart, segEnd)
            val t = ((point.latitude - segStart.latitude) * (segEnd.latitude - segStart.latitude) +
                    (point.longitude - segStart.longitude) * (segEnd.longitude - segStart.longitude)) /
                    (segLength * segLength)

            when {
                // Le point est avant le début du segment
                t < 0 -> calculateDistance(point, segStart)
                // Le point est après la fin du segment
                t > 1 -> calculateDistance(point, segEnd)
                // Le point est le long du segment
                else -> {
                    val proj = LatLng(
                        segStart.latitude + t * (segEnd.latitude - segStart.latitude),
                        segStart.longitude + t * (segEnd.longitude - segStart.longitude)
                    )
                    calculateDistance(point, proj)
                }
            }
        }
    }

    // Set permission rationale visibility
    fun setPermissionRationale(show: Boolean) {
        _showPermissionRationale.value = show
    }

    // Calcule la distance entre deux points en mètres
    private fun calculateDistance(a: LatLng, b: LatLng): Float {
        val results = FloatArray(1)
        Location.distanceBetween(
            a.latitude, a.longitude,
            b.latitude, b.longitude,
            results
        )
        return results[0]
    }

    fun startPathTracking(pathPoints: List<LatLng>) {
        stopPathTracking()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    val userLatLng = LatLng(location.latitude, location.longitude)
                    _userLocation.value = userLatLng
                    updatePathDirection(userLatLng, pathPoints)
                }
            }
        }

        try {
            mapService.fusedLocationClient.requestLocationUpdates(
                LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000).build(),
                ContextCompat.getMainExecutor(mapService.context),
                locationCallback as LocationCallback
            )
        } catch (e: SecurityException) {
            _errorMessage.value = "Location permission required"
        }
    }

    fun stopPathTracking() {
        locationCallback?.let {
            mapService.fusedLocationClient.removeLocationUpdates(it)
            locationCallback = null
        }
    }

    // Ajoute un marqueur d'incident sur la carte
    fun addIncidentMarker(position: LatLng, type: String, id: String, iconRes: BitmapDescriptor? = null) {
        // Vérifier si un marqueur avec cet ID existe déjà
        if (_incidentMarkerIds.contains(id)) {
            Log.d("IncidentDebug", "Le marqueur avec l'ID $id est déjà affiché, pas de doublon.")
            return
        }

        // Ajouter l'ID de l'incident au Set pour éviter les doublons
        _incidentMarkerIds.add(id)

        val options = MarkerOptions()
            .position(position)
            .title("Incident: $type")
            .icon(
                iconRes?.let {
                    Log.d("IncidentDebug", "Chargement d'une icône BitmapDescriptor: $it")
                    it
                } ?: BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE)
            )

        mapService.addMarker(options)?.let { marker ->
            Log.d("IncidentDebug", "Marker ajouté sur la map avec succès pour $type")
            _incidentMarkers.add(marker)
        } ?: Log.e("IncidentDebug", "Échec de l'ajout du marker pour $type")
    }

    // Supprime tous les marqueurs d'incident de la carte
    fun clearIncidentMarkers() {
        _incidentMarkers.forEach { it.remove() }
        _incidentMarkers.clear()
    }

    // Initialise la carte Google Maps
    fun initializeMap(googleMap: GoogleMap) {
        mapService.setMap(googleMap)
        // Ajouter les marqueurs en attente
        _pendingMarkers.forEach { options ->
            mapService.addMarker(options)?.let { marker ->
                _markers.value += marker
            }
        }
        _pendingMarkers.clear()
    }

    fun updateUserLocation(location: LatLng) {
        _userLocation.value = location
    }

    fun updateRoute(points: String) {
        _routePoints.value = points
    }

    fun updatePath(points: List<LatLng>) {
        _pathPoints.value = points
    }

    // Nettoyage
    override fun onCleared() {
        super.onCleared()
        orientationService.stop()
    }
}