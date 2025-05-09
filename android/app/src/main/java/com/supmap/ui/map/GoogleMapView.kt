package com.supmap.ui.map

import android.content.Context
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.shouldShowRationale
import android.Manifest
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Camera
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.location.Location
import android.util.Log
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Offset
import com.google.android.gms.maps.CameraUpdateFactory
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.supmap.data.GraphHopperResponse
import com.supmap.services.map.GoogleMapService
import com.supmap.services.map.OrientationService
import com.supmap.viewModel.map.MapViewModel
import com.google.android.gms.maps.model.JointType
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.RoundCap
import com.supmap.R
import com.supmap.data.Incident
import kotlinx.coroutines.delay
import kotlin.math.abs
import kotlin.math.min
import com.google.maps.android.SphericalUtil

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun GoogleMapView(
    modifier: Modifier = Modifier,
    context: Context = LocalContext.current,
    isPerspectiveView: Boolean = false,
    onMapClick: (LatLng) -> Unit = {},
    onMarkerClick: () -> Boolean = { false },
    destination: LatLng? = null,
    selectedRoute: GraphHopperResponse? = null,
    departure: LatLng? = null,
    mapViewModel: MapViewModel,
    reportedIncidents: List<Incident> = emptyList(),
) {
    // Initialisation des services et ViewModel
    val mapService = remember { GoogleMapService(context) }
    val orientationService = remember { OrientationService(context) }
    val viewModel = remember { MapViewModel(mapService, orientationService) }
    val bearing by viewModel.bearing.collectAsState()

    // États et permissions
    val fineLocationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    val coarseLocationPermission = rememberPermissionState(Manifest.permission.ACCESS_COARSE_LOCATION)
    val userLocation by viewModel.userLocation.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val customOrange = Color(0xFFF15B4E)
    val currentBearing by orientationService.orientation.collectAsState()
    val currentTime = System.currentTimeMillis()
    val rotation = rememberUpdatedState(currentBearing)
    val lastUpdateTime = remember { mutableStateOf(0L) }
    val departurePoint = remember(selectedRoute) {
        selectedRoute?.paths?.firstOrNull()?.points?.let { decodePolyline(it).firstOrNull() }
    }
    val arrivalPoint = remember(selectedRoute) {
        selectedRoute?.paths?.firstOrNull()?.points?.let { decodePolyline(it).lastOrNull() }
    }
    val effectiveDeparture by remember(departure, selectedRoute) {
        derivedStateOf {
            departure ?: selectedRoute?.paths?.firstOrNull()?.points?.let {
                decodePolyline(it).firstOrNull()
            }
        }
    }

    // Camera position state
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(
            userLocation ?: LatLng(48.8566, 2.3522), // Paris par défaut
            if (isPerspectiveView) 18f else 12f
        )
    }

    val animatedRotation = animateFloatAsState(
        targetValue = rotation.value,
        animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing) // Lissage de l'animation
    )

    val smoothedPath = remember { mutableStateOf<List<LatLng>>(emptyList()) }

    LaunchedEffect(selectedRoute) {
        selectedRoute?.paths?.firstOrNull()?.points?.let { encodedPolyline ->
            val pathPoints = decodePolyline(encodedPolyline)
            smoothedPath.value = smoothPath(pathPoints) // Utiliser une version "lissée" du chemin
        }
    }

    // Chargement ou message d'erreur
    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }

    if (errorMessage != null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
            Text(
                text = errorMessage ?: "Erreur inconnue",
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(16.dp)
            )
        }
    }

    LaunchedEffect(userLocation, selectedRoute, isPerspectiveView, currentBearing, fineLocationPermission.status, coarseLocationPermission.status) {
        // Gérer la mise à jour de la direction du chemin
        if (userLocation != null && selectedRoute != null) {
            selectedRoute.paths.firstOrNull()?.points?.let { encodedPolyline ->
                val pathPoints = decodePolyline(encodedPolyline)
                val location = userLocation ?: LatLng(48.8566, 2.3522) // Paris par défaut si null
                viewModel.updatePathDirection(location, pathPoints)
            }
        }

        // Déplace la caméra vers la position de l'utilisateur en vue perspective si besoin
        userLocation?.let { location ->
            if (isPerspectiveView) {
                val latLng = LatLng(location.latitude, location.longitude)
                // Évite les animations inutiles si l'utilisateur ne s'est pas assez déplacé
                val currentLatLng = cameraPositionState.position.target
                val distance = FloatArray(1)
                Location.distanceBetween(
                    currentLatLng.latitude,
                    currentLatLng.longitude,
                    latLng.latitude,
                    latLng.longitude,
                    distance
                )

                if (distance[0] > 3f) { // Seuil pour éviter des mouvements inutiles
                    cameraPositionState.animate(
                        CameraUpdateFactory.newCameraPosition(
                            CameraPosition(
                                latLng,
                                18f,
                                60f,
                                currentBearing
                            )
                        ),
                        1000
                    )
                }
            }
        }

        // Applique une animation de caméra selon la vue (perspective ou non)
        if (isPerspectiveView) {
            cameraPositionState.animate(
                CameraUpdateFactory.newCameraPosition(
                    CameraPosition(
                        userLocation?.let { location ->
                            LatLng(location.latitude, location.longitude)
                        } ?: LatLng(48.8566, 2.3522), // Paris par défaut si null
                        if (isPerspectiveView) 18f else 12f,
                        if (isPerspectiveView) 60f else 0f,
                        currentBearing
                    )
                ),
                500
            )
        }

        // Gestion des permissions
        when {
            fineLocationPermission.status.isGranted || coarseLocationPermission.status.isGranted -> {
                viewModel.fetchUserLocation()
                viewModel.startTrackingLocation()
            }
            fineLocationPermission.status.shouldShowRationale || coarseLocationPermission.status.shouldShowRationale -> {
                viewModel.setPermissionRationale(true)
            }
            else -> {
                fineLocationPermission.launchPermissionRequest()
                coarseLocationPermission.launchPermissionRequest()
            }
        }

        // Mise à jour finale de la caméra après positionnement de l'utilisateur
        userLocation?.let { location ->
            if (isPerspectiveView) {
                // En vue perspective : positionnement direct de la caméra
                cameraPositionState.position = CameraPosition(
                    LatLng(location.latitude, location.longitude),
                    18f,
                    60f,
                    currentBearing
                )
            } else {
                // Sinon : recentrage en incluant le chemin et les points clés
                if (departurePoint != null && arrivalPoint != null) {
                    val boundsBuilder = LatLngBounds.builder()
                        .include(departurePoint)
                        .include(arrivalPoint)
                        .include(LatLng(location.latitude, location.longitude))

                    if (smoothedPath is Iterable<*>) {
                        smoothedPath.forEach { point ->
                            if (point is LatLng) {
                                boundsBuilder.include(point)
                            }
                        }
                    }

                    val bounds = boundsBuilder.build()
                    val displayMetrics = Resources.getSystem().displayMetrics
                    val screenWidth = displayMetrics.widthPixels
                    val screenHeight = displayMetrics.heightPixels

                    // Détermine le padding à appliquer autour du chemin pour l'affichage
                    val distance = SphericalUtil.computeDistanceBetween(departurePoint, arrivalPoint)
                    val paddingCoefficient = if (distance < 10000) 0.5 else 0.2
                    val maxPadding = min(screenWidth, screenHeight) / 2
                    val padding = min(
                        (min(screenWidth, screenHeight) * paddingCoefficient).toInt(),
                        maxPadding - 50
                    )

                    try {
                        cameraPositionState.animate(
                            CameraUpdateFactory.newLatLngBounds(bounds, padding),
                            300
                        )
                    } catch (e: Exception) {
                        // Fallback en cas d'échec
                        cameraPositionState.position = CameraPosition(
                            LatLng(location.latitude, location.longitude),
                            12f,
                            0f,
                            currentBearing
                        )
                    }
                } else {
                    cameraPositionState.position = CameraPosition(
                        LatLng(location.latitude, location.longitude),
                        12f,
                        0f,
                        currentBearing
                    )
                }
            }
            lastUpdateTime.value = currentTime
        }
    }

    // Propriétés de la carte
    val mapProperties = MapProperties(
        isMyLocationEnabled = false,
        isBuildingEnabled = false,
        isTrafficEnabled = false,
        mapType = MapType.NORMAL,
        isIndoorEnabled = false
    )

    // Paramètres UI
    val mapUiSettings by remember {
        mutableStateOf(
            MapUiSettings(
                compassEnabled = false,
                zoomControlsEnabled = false,
                myLocationButtonEnabled = false,
                rotationGesturesEnabled = true,
                scrollGesturesEnabled = true,
                tiltGesturesEnabled = isPerspectiveView,
                zoomGesturesEnabled = true
            )
        )
    }

    // GoogleMap Composable
    GoogleMap(
        modifier = modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = mapProperties,
        uiSettings = mapUiSettings,
        onMapLoaded = {
            Log.d("GoogleMap", "Carte chargée")
            // Si la permission de localisation est accordée, on récupère la localisation de l'utilisateur
            if (fineLocationPermission.status.isGranted || coarseLocationPermission.status.isGranted) {
                viewModel.fetchUserLocation()
            }
            // Affichage des incidents signalés sur la carte
            reportedIncidents.forEach { incident ->
                val iconDescriptor = incident.iconRes?.let { iconRes ->
                    BitmapDescriptorFactory.fromResource(iconRes)
                }
                mapViewModel.addIncidentMarker(
                    position = incident.location,
                    type = incident.type,
                    id = incident.id,
                    iconRes = iconDescriptor
                )
            }
        },
        onMapClick = onMapClick
    ) {
        MapEffect(Unit) { googleMap ->
            mapService.setMap(googleMap)
            mapViewModel.initializeMap(googleMap)
        }
        // Si la localisation de l'utilisateur est disponible, on affiche un marqueur personnalisé pour sa position
        userLocation?.let { location ->
            val smallIcon = remember(location, bearing, isPerspectiveView) {
                // Décoder et redimensionner l'image de la flèche pour la direction
                val originalBitmap = BitmapFactory.decodeResource(context.resources, R.drawable.fleche)

                // Choix de la taille en fonction de la perspective
                val targetSize = if (isPerspectiveView) 250f else 150f

                val scale = minOf(
                    targetSize / originalBitmap.width,
                    targetSize / originalBitmap.height
                ).coerceAtMost(1f)

                val bitmap = Bitmap.createBitmap(250, 250, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)

                // Appliquer la rotation seulement en perspective
                val matrix = Matrix().apply {
                    postScale(scale, scale)
                    postTranslate(
                        (250f - originalBitmap.width * scale) / 2f,
                        (250f - originalBitmap.height * scale) / 2f
                    )
                }

                canvas.drawBitmap(originalBitmap, matrix, paint)

                BitmapDescriptorFactory.fromBitmap(bitmap)
            }

            val markerState = remember { MarkerState(position = location) }
            LaunchedEffect(location) {
                animateMarkerTo(markerState, location)
            }

            // Affichage du marqueur représentant la localisation de l'utilisateur
            Marker(
                state = markerState,
                icon = smallIcon,
                anchor = Offset(0.5f, 0.5f),
                rotation = animatedRotation.value,
                flat = true,
                onClick = { onMarkerClick() }
            )
        }

        // Affichage du marqueur de destination
        destination?.let { dest ->
            Marker(
                state = rememberMarkerState(position = dest),
                title = "Destination",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
            )
        }

        // Ajout une seule fois du marqueur de départ, uniquement si besoin
        val showDepartureMarkerOnce = remember {
            mutableStateOf(false)
        }

        LaunchedEffect(effectiveDeparture, userLocation) {
            if (effectiveDeparture != null && userLocation != null) {
                if (!effectiveDeparture.isSamePosition(userLocation)) {
                    showDepartureMarkerOnce.value = true
                }
            }
        }

        // Affichage du marqueur de départ
        effectiveDeparture?.let { departurePoint ->
            if (showDepartureMarkerOnce.value) {
                val startIcon = remember {
                    BitmapDescriptorFactory.fromBitmap(
                        Bitmap.createScaledBitmap(
                            BitmapFactory.decodeResource(context.resources, R.drawable.pins_supmap),
                            100, 120, false
                        )
                    )
                }
                Marker(
                    state = rememberMarkerState(position = departurePoint),
                    title = "Point de départ",
                    icon = startIcon,
                    anchor = Offset(0.5f, 0.5f)
                )
            }
        }

        Log.d("GoogleMapView", "selectedRoute=$selectedRoute, paths=${selectedRoute?.paths?.size}, points=${selectedRoute?.paths?.firstOrNull()?.points}")
        selectedRoute?.paths?.firstOrNull()?.points?.let { encodedPolyline ->
            val pathPoints = decodePolyline(encodedPolyline)
            Log.d("GoogleMapView", "Polyline décodée - ${pathPoints.size} points")

            // Appliquer le lissage sur la polyline pour la rendre plus fluide
            val smoothedPoints = smoothPath(pathPoints)

            // Dessiner la polyline lissée
            Polyline(
                points = smoothedPoints,
                color = customOrange,
                width = if (isPerspectiveView) 30f else 10f,
                jointType = JointType.ROUND,
                geodesic = true,
                startCap = RoundCap(),
                endCap = RoundCap(),
            )

            // Créer un marqueur personnalisé pour la destination de la polyline
            val originalBitmap = BitmapFactory.decodeResource(context.resources, R.drawable.pins_supmap)
            val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, 100, 120, false)
            val customMarker = BitmapDescriptorFactory.fromBitmap(scaledBitmap)

            if (pathPoints.isNotEmpty()) {
                val destination = pathPoints.last()

                // Ajouter un marqueur à la dernière position de la polyline
                Marker(
                    state = MarkerState(position = destination),
                    icon = customMarker,
                    anchor = Offset(0.5f, 0.5f)
                )
            }

            // Gérer le suivi du chemin et ajuster la caméra pour afficher correctement le chemin
            LaunchedEffect(selectedRoute) {
                if (isPerspectiveView) {
                    return@LaunchedEffect
                }
                var smoothedPath: List<LatLng> = emptyList()

                // Suivi du chemin lissé
                if (selectedRoute != null) {
                    selectedRoute.paths?.firstOrNull()?.points?.let { encodedPolyline ->
                        val pathPoints = decodePolyline(encodedPolyline)
                        smoothedPath = smoothPath(pathPoints)

                        viewModel.startPathTracking(smoothedPath)
                        delay(300)
                        mapViewModel.updatePath(smoothedPath)
                    } ?: run {
                        mapViewModel.updatePath(emptyList())
                    }
                } else {
                    viewModel.stopPathTracking()
                }
            }
        }

        DisposableEffect(Unit) {
            onDispose {
                viewModel.stopPathTracking()
            }
        }

        // Affichage d'un itinéraire entre l'utilisateur et la destination, si la route n'est pas sélectionnée
        if (destination != null && userLocation != null && selectedRoute == null) {
            Polyline(
                points = listOf(userLocation!!, destination),
                color = customOrange,
                width = 10f
            )
        }
    }

    // Gestion du bouton pour demander les permissions de localisation
    if (!fineLocationPermission.status.isGranted && !coarseLocationPermission.status.isGranted) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Button(
                onClick = {
                    fineLocationPermission.launchPermissionRequest()
                    coarseLocationPermission.launchPermissionRequest()
                },
                modifier = Modifier.padding(16.dp)
            ) {
                Text("Activer la localisation")
            }
        }
    }
}

// Fonction qui lisse un chemin (liste de points) pour le rendre plus fluide
fun smoothPath(points: List<LatLng>): List<LatLng> {
    if (points.size < 3) return points

    val smoothed = mutableListOf<LatLng>()
    smoothed.add(points.first())

    for (i in 1 until points.size - 1) {
        val prev = points[i - 1]
        val curr = points[i]
        val next = points[i + 1]

        // Ajout d'un point intermédiaire entre le point précédent et le point actuel
        smoothed.add(LatLng(
            (prev.latitude + curr.latitude) / 2,
            (prev.longitude + curr.longitude) / 2
        ))
        // Ajout du point actuel
        smoothed.add(curr)
        // Ajout d'un point intermédiaire entre le point actuel et le point suivant
        smoothed.add(LatLng(
            (curr.latitude + next.latitude) / 2,
            (curr.longitude + next.longitude) / 2
        ))
    }

    smoothed.add(points.last())
    return smoothed
}

// Extension de la classe LatLng pour vérifier si deux points sont à la même position
private fun LatLng?.isSamePosition(other: LatLng?, tolerance: Double = 0.0005): Boolean {
    if (this == null || other == null) return false
    // Comparaison des coordonnées des deux points avec une tolérance
    return abs(latitude - other.latitude) < tolerance &&
            abs(longitude - other.longitude) < tolerance
}

// Anime un marqueur vers une nouvelle position en effectuant une transition fluide
suspend fun animateMarkerTo(markerState: MarkerState, newPos: LatLng) {
    val start = markerState.position
    val duration = 300L
    val steps = 30
    val stepDuration = duration / steps

    for (i in 1..steps) {
        val lat = start.latitude + (newPos.latitude - start.latitude) * i / steps
        val lng = start.longitude + (newPos.longitude - start.longitude) * i / steps
        markerState.position = LatLng(lat, lng)
        delay(stepDuration)
    }
}
