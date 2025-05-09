package com.supmap.ui.map

import android.Manifest
import android.annotation.SuppressLint
import android.app.Application
import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState
import androidx.compose.material.icons.Icons
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.zIndex
import com.google.accompanist.permissions.isGranted
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Flag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.supmap.data.SuggestionResponse
import com.supmap.services.RetrofitClient
import com.supmap.services.map.GoogleMapService
import com.supmap.services.map.OrientationService
import com.supmap.ui.map.incidents.IncidentButton
import com.supmap.ui.map.itineraire.RouteDetailsSection
import com.supmap.ui.map.searchItineraire.SuggestionsList
import com.supmap.viewModel.route.RouteViewModel
import com.supmap.viewModel.route.RouteViewModelFactory
import com.google.android.gms.maps.model.LatLng
import com.supmap.viewModel.incident.IncidentViewModelFactory
import com.supmap.ui.map.searchItineraire.SearchBar
import com.supmap.ui.map.searchItineraire.*
import com.supmap.ui.map.searchItineraire.SearchOverlay
import com.supmap.viewModel.settings.SettingsViewModel
import com.supmap.viewModel.settings.SettingsViewModelFactory
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.viewModel.map.MapViewModel
import com.supmap.viewModel.map.MapViewModelFactory
import com.supmap.viewmodels.IncidentViewModel

@SuppressLint("RememberReturnType")
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun MapScreen(
    navController: NavController,
    routeId: String? = null,
) {
    // Récupérer le contexte de l'application
    val context = LocalContext.current
    // État de la permission de localisation
    val permissionState = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    val authViewModel: AuthViewModel = viewModel() // ViewModel d'authentification
    val mapService = remember { GoogleMapService(context) } // Service pour gérer la carte
    val orientationService = remember { OrientationService(context) } // Service pour gérer l'orientation de la carte
    val application = context.applicationContext as Application
    val settingsViewModel: SettingsViewModel = viewModel(
        factory = SettingsViewModelFactory(application)
    )
    val isDeepLink = remember { mutableStateOf(routeId != null) } // Vérifier si un lien profond est utilisé
    // Création des ViewModels pour la carte, la route et l'incident
    val mapViewModel: MapViewModel = viewModel(
        factory = MapViewModelFactory(mapService, orientationService)
    )
    val incidentService = remember { RetrofitClient.incidentService }
    val incidentViewModel: IncidentViewModel = viewModel(
        factory = IncidentViewModelFactory(
            incidentService = incidentService,
            authViewModel = authViewModel
        )
    )

    val viewModel: RouteViewModel = viewModel(
        factory = RouteViewModelFactory(
            searchService = RetrofitClient.searchService,
            authViewModel = authViewModel,
            appContext = context,
            mapViewModel = mapViewModel,
            settingsViewModel = settingsViewModel,
            incidentViewModel = incidentViewModel
        )
    )
    // États pour gérer différents comportements de l'interface utilisateur
    val (showIncidentMenu, setShowIncidentMenu) = remember { mutableStateOf(false) }
    val (isSearchFocused, setIsSearchFocused) = remember { mutableStateOf(false) }
    val (showRouteOptions, setShowRouteOptions) = remember { mutableStateOf(false) }
    val (showSuggestionsForMain, setShowSuggestionsForMain) = remember { mutableStateOf(false) }
    val (searchQuery, setSearchQuery) = remember { mutableStateOf("") }
    val (searchQueryMain, setSearchQueryMain) = remember { mutableStateOf("") }
    val (selectedRouteDetails, setSelectedRouteDetails) = remember { mutableStateOf<String?>(null) }
    val (showQuitButton, setShowQuitButton) = remember { mutableStateOf(false) }
    val (isPerspectiveView, setIsPerspectiveView) = remember { mutableStateOf(false) }
    val (hasSelectedMainPlace, setHasSelectedMainPlace) = remember { mutableStateOf(false) }
    val (showMainSearch, setShowMainSearch) = remember { mutableStateOf(true) }
    val (showDestinationSearch, setShowDestinationSearch) = remember { mutableStateOf(false) }
    val (showDepartureSuggestions, setShowDepartureSuggestions) = remember { mutableStateOf(false) }
    val (showMainSearchBar, setShowMainSearchBar) = remember { mutableStateOf(true) }
    // Collecte des données de l'itinéraire sélectionné et de ses informations
    val selectedRoute by viewModel.selectedRoute.collectAsState()
    val selectedRouteInfo by viewModel.selectedRouteInfo.collectAsState()

    val customPurple = Color(0xFF6A4C93)
    val customOrange = Color(0xFFF15B4E)
    val isWhiteBackgroundVisible = showSuggestionsForMain || showRouteOptions ||
            selectedRouteDetails != null || isSearchFocused || hasSelectedMainPlace

    // Demander la permission de localisation
    LaunchedEffect(permissionState) {
        permissionState.launchPermissionRequest()
    }

    val defaultLocation = LatLng(48.8566, 2.3522) // Localisation par défaut (Paris)
    // Si les coordonnées de départ et d'arrivée sont définies, récupérer les options d'itinéraires
    LaunchedEffect(viewModel.fromCoords.value, viewModel.toCoords.value) {
        if (viewModel.fromCoords.value != null &&
            viewModel.toCoords.value != null) {
            viewModel.fetchRouteOptions()
        }
    }

    val hasHandledDeepLink = remember { mutableStateOf(false) }

    // Si un lien profond est utilisé, charger la route correspondante
    LaunchedEffect(routeId) {
        if (routeId != null && !hasHandledDeepLink.value) {
            hasHandledDeepLink.value = true
            Log.d("MapScreen", "Chargement de la route existante: $routeId")

            // Masquer les éléments inutiles et charger la route
            setShowMainSearchBar(false)
            setShowRouteOptions(false)
            setShowSuggestionsForMain(false)
            setIsSearchFocused(false)
            isDeepLink.value = true

            // Charger la route par son ID
            viewModel.loadRouteById(routeId)

            // Forcer l'affichage des instructions
            setSelectedRouteDetails("auto")
        }
    }

    // Démarrer les mises à jour quand un itinéraire est sélectionné
    LaunchedEffect(selectedRouteDetails) {
        if (selectedRouteDetails != null) {
            viewModel.startNavigationUpdates(forceStart = isDeepLink.value)
        } else {
            viewModel.stopNavigationUpdates()
        }
    }

    // Affichage de la carte avec les différents éléments UI
    Box(Modifier.fillMaxSize()) {
        GoogleMapView(
            isPerspectiveView = isPerspectiveView,
            selectedRoute = selectedRoute,
            departure = if (permissionState.status.isGranted) {
                viewModel.fromCoords.value?.let { coords ->
                    LatLng(coords.latitude, coords.longitude)
                }
            } else {
                defaultLocation
            },
            mapViewModel = mapViewModel
        )

        // Affichage de la barre de recherche principale lorsque le lieu principal est sélectionné
        if (hasSelectedMainPlace) {
            SearchOverlay(
                viewModel = viewModel,
                departureQuery = searchQueryMain,
                destinationQuery = searchQuery,
                showRouteOptions = showRouteOptions,
                showSuggestions = showDepartureSuggestions,
                onDepartureQueryChange = { query ->
                    setSearchQueryMain(query)
                    viewModel.updateFromQuery(query)
                    setShowDepartureSuggestions(query.isNotEmpty())
                    setShowRouteOptions(false)
                },
                onDestinationQueryChange = { setSearchQuery(it) },
                onShowSuggestionsChange = setShowDepartureSuggestions,
                onShowRouteOptionsChange = setShowRouteOptions,
                onSwapClick = {
                    setSearchQuery(searchQueryMain).also { setSearchQueryMain(searchQuery) }
                },
                onPlaceSelected = { suggestion ->
                    setSearchQueryMain(formatSuggestion(suggestion))
                    setShowRouteOptions(true)
                    setShowDepartureSuggestions(false)
                    setIsSearchFocused(false)
                },
                onRouteSelected = { routeType ->
                    setSelectedRouteDetails(routeType)
                    setShowRouteOptions(false)
                    setShowDepartureSuggestions(false)
                    setIsSearchFocused(false)
                    setShowMainSearchBar(false)
                    setHasSelectedMainPlace(false)
                },
                onFocusChange = { isFocused ->
                    Log.d("SearchOverlay", "Focus changed: isFocused = $isFocused") // TODO : revoir
                    setShowMainSearchBar(!isFocused)
                    setIsSearchFocused(isFocused)
                },
                customPurple = customPurple
            )
        }

        // Gestion du retour à la carte
        if (isWhiteBackgroundVisible && selectedRouteDetails == null) {
            IconButton(
                onClick = {
                    // Réinitialiser l'état pour revenir à la carte
                    setHasSelectedMainPlace(false)
                    setShowRouteOptions(false)
                    setShowSuggestionsForMain(false)
                    setShowDestinationSearch(false)
                    setSearchQuery("")
                    setSearchQueryMain("")
                    setIsSearchFocused(false)
                    setShowMainSearchBar(true)
                    viewModel.clearErrors()
                },
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(start = 8.dp, top = 17.dp)
                    .background(Color.White.copy(alpha = 0.9f), shape = RoundedCornerShape(50))
                    .zIndex(3f)
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Retour à la carte",
                    tint = Color.Black
                )
            }
        }

        // Affichage de la barre de recherche principale
        if (selectedRouteDetails == null && showMainSearchBar) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(if (showSuggestionsForMain) Color.White else Color.Transparent)
                    .zIndex(2f)
            ) {
                MainSearchBar(
                    searchQuery = searchQuery,
                    onSearchQueryChange = { query ->
                        setSearchQuery(query)
                        viewModel.updateToQuery(query)
                        setShowSuggestionsForMain(query.isNotEmpty())
                        setIsSearchFocused(true)
                        setShowRouteOptions(false)
                    },
                    onSearchClick = {
                        setIsSearchFocused(true)
                        setShowSuggestionsForMain(searchQuery.isNotEmpty())
                        setShowMainSearch(true)
                        setShowDestinationSearch(false)
                    },
                    onMenuClick = { navController.navigate("menuScreen") },
                    isSearchFocused = isSearchFocused,
                    showRouteOptions = showRouteOptions,
                    showSuggestions = showSuggestionsForMain,
                    suggestions = viewModel.toSuggestions.collectAsState().value,
                    onPlaceSelected = { suggestion ->
                        viewModel.selectSuggestion(suggestion, false)
                        setSearchQuery(formatSuggestion(suggestion))
                        setShowSuggestionsForMain(false)
                        setIsSearchFocused(false)
                        setHasSelectedMainPlace(true)
                        setShowRouteOptions(true)
                        setShowMainSearch(false)
                        setShowDestinationSearch(true)
                    },
                    onShowRouteOptionsChange = setShowRouteOptions,
                    onShowSuggestionsChange = setShowSuggestionsForMain,
                    customOrange = customOrange,
                    customPurple = customPurple,
                    viewModel = viewModel,
                    isWhiteBackgroundVisible = isWhiteBackgroundVisible,
                    showMainSearchBar = showMainSearchBar
                )
            }
        }

        // Affichage des détails de l'itinéraire sélectionné
        selectedRouteDetails?.let {
            selectedRouteInfo?.let { routeInfo ->
                RouteDetailsSection(
                    customPurple = customPurple,
                    customOrange = customOrange,
                    showQuitButton = showQuitButton,
                    onQuitClick = {
                        setSearchQuery("")
                        setSearchQueryMain("")
                        setShowQuitButton(false)
                        setSelectedRouteDetails(null)
                        setShowMainSearch(true)
                        setShowDestinationSearch(false)
                        setShowMainSearchBar(true)
                        setHasSelectedMainPlace(false)
                    },
                    onOptionsClick = { setShowQuitButton(!showQuitButton) },
                    routeInfo = routeInfo,
                    modifier = Modifier.align(Alignment.BottomCenter),
                    viewModel = viewModel
                )
            }
        }

        // Affichage du bouton pour signaler un incident, si la permission est accordée
        if (permissionState.status.isGranted) {
            if (selectedRouteDetails != null)
                IncidentButton(
                    viewModel = incidentViewModel,
                    mapViewModel = mapViewModel,
                    showIncidentMenu = showIncidentMenu,
                    onIncidentClick = { setShowIncidentMenu(true) },
                    onDismiss = { setShowIncidentMenu(false) },
                    bottomOffset = when {
                        showQuitButton -> 200.dp
                        selectedRouteDetails != null -> 140.dp
                        else -> 60.dp
                    }
                )
        }
        // Affichage du bouton pour changer de vue (2D ou 3D)
        if ((!isWhiteBackgroundVisible && permissionState.status.isGranted) || selectedRouteDetails != null) {
            PerspectiveButton(
                isPerspectiveView = isPerspectiveView,
                onClick = { setIsPerspectiveView(!isPerspectiveView) },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 4.dp)
                    .offset(
                        y = when {
                            showQuitButton -> (-150).dp
                            selectedRouteDetails != null -> (-90).dp
                            else -> (-10).dp
                        }
                    )
            )
        }
    }
}

@Composable
private fun MainSearchBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onSearchClick: () -> Unit,
    onMenuClick: () -> Unit,
    isSearchFocused: Boolean,
    showRouteOptions: Boolean,
    showSuggestions: Boolean,
    suggestions: List<SuggestionResponse>,
    onPlaceSelected: (SuggestionResponse) -> Unit,
    onShowRouteOptionsChange: (Boolean) -> Unit,
    onShowSuggestionsChange: (Boolean) -> Unit,
    customOrange: Color,
    customPurple: Color,
    showMainSearchBar: Boolean,
    viewModel: RouteViewModel,
    isWhiteBackgroundVisible: Boolean,
    modifier: Modifier = Modifier,
) {
    // Récupérer l'erreur du ViewModel
    val routeError by viewModel.routeError.collectAsState()
    val isLoading by viewModel.suggestionsLoading.collectAsState()
    val routeLoading by viewModel.routeOptionsLoading.collectAsState()
    val suggestionError by viewModel.suggestionError.collectAsState()

    Box(modifier.padding(top = if (showRouteOptions) 85.dp else 35.dp)) {
        Column {
            // Barre de recherche
            SearchBar(
                searchQuery = searchQuery,
                onSearchQueryChange = { query ->
                    // Lorsque la requête de recherche change
                    onSearchQueryChange(query)
                    onShowRouteOptionsChange(false) // Masquer les options de route
                    onShowSuggestionsChange(query.isNotEmpty() || isSearchFocused) // Afficher les suggestions si la requête est assez longue
                },
                onSearchClick = {
                    // Quand l'utilisateur clique sur la recherche
                    onSearchClick()
                    onShowSuggestionsChange(searchQuery.isNotEmpty()) // Afficher les suggestions si une requête existe
                },
                onMenuClick = onMenuClick,
                showRouteOptions = showRouteOptions,
                showMenuIcon = !isWhiteBackgroundVisible && showMainSearchBar && !isSearchFocused,
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Flag,
                        contentDescription = "Lieux personnels",
                        modifier = Modifier.size(40.dp).padding(start = 15.dp),
                        tint = customOrange
                    )
                },
                modifier = Modifier.fillMaxWidth().height(100.dp)
            )

            // Afficher un indicateur de chargement si les suggestions sont en cours de récupération
            if (isLoading && !routeLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(vertical = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(
                            color = customPurple,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Recherche en cours...",
                            color = customPurple
                        )
                    }
                }
            }

            // Afficher l'erreur de route si elle existe
            if (!isWhiteBackgroundVisible && (suggestionError != null && !isLoading)) {
                routeError?.let {
                    ErrorMessage(
                        message = it,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp)
                    )
                }
            }

            // Si les suggestions doivent être affichées, et que la recherche est focalisée, afficher les suggestions
            if (showSuggestions && isSearchFocused && suggestions.isNotEmpty()) {
                Box(Modifier.fillMaxWidth()) {
                    SuggestionsList(
                        suggestions = viewModel.getSuggestionsWithDistance().map { it.suggestion },
                        onPlaceSelected = { suggestion ->
                            // Quand une suggestion est sélectionnée
                            onPlaceSelected(suggestion)
                            onShowRouteOptionsChange(true) // Afficher les options de route
                        },
                        customPurple = customPurple,
                        isLoading = viewModel.suggestionsLoading.collectAsState().value
                    )
                }
            }
        }
    }
}

// Composant pour afficher un message d'erreur
@Composable
fun ErrorMessage(message: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            color = Color.Red,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontSize = 20.sp
            ),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
    }
}

