package com.supmap.ui.map.searchItineraire

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.SyncAlt
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.rotate
import com.google.android.gms.maps.model.LatLng
import com.supmap.data.SuggestionResponse
import com.supmap.ui.map.ErrorMessage
import com.supmap.viewModel.route.RouteViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

@Composable
fun SearchOverlay(
    viewModel: RouteViewModel,
    departureQuery: String,
    destinationQuery: String,
    showRouteOptions: Boolean,
    showSuggestions: Boolean,
    onDepartureQueryChange: (String) -> Unit,
    onDestinationQueryChange: (String) -> Unit,
    onShowSuggestionsChange: (Boolean) -> Unit,
    onShowRouteOptionsChange: (Boolean) -> Unit,
    onSwapClick: () -> Unit,
    onPlaceSelected: (SuggestionResponse) -> Unit,
    onRouteSelected: (String) -> Unit,
    customPurple: Color,
    onFocusChange: (Boolean) -> Unit
) {
    val suggestionError by viewModel.suggestionError.collectAsState()
    val isLoading by viewModel.suggestionsLoading.collectAsState()
    val toSuggestions = viewModel.toSuggestions.collectAsState().value
    val fromSuggestions = viewModel.fromSuggestions.collectAsState().value
    var isFromFieldFocused by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var fromSearchJob by remember { mutableStateOf<Job?>(null) }

    // Effet déclenché lors du changement des suggestions pour récupérer les options de route
    LaunchedEffect(fromSuggestions, toSuggestions) {
        if (fromSuggestions != null && toSuggestions != null && !showSuggestions) {
            viewModel.fetchRouteOptions()
        }
    }

    LaunchedEffect(departureQuery) {
        if (departureQuery.isEmpty()) {
            // Si la requête est vide, essayer de récupérer la position actuelle de l'utilisateur
            if (viewModel._currentPosition.value == null) {
                errorMessage = "Veuillez activer votre position ou remplir ce champ manuellement."
            } else {
                // Si la position actuelle est disponible, mettre à jour fromCoords
                viewModel._currentPosition.value?.let { currentLocation ->
                    viewModel._fromCoords.value = LatLng(currentLocation.latitude, currentLocation.longitude)
                    viewModel.fetchSuggestions("${currentLocation.latitude},${currentLocation.longitude}", true)
                }
            }
        } else {
            // Si la requête n'est pas vide, effectuer la recherche de suggestions
            viewModel.fetchSuggestions(departureQuery, true)
            errorMessage = null
        }
    }


    Box(Modifier.fillMaxSize().background(if (showRouteOptions || showSuggestions) Color.White else Color.Transparent)) {
        // Affichage du champ de recherche pour la position de départ
        SearchBar(
            searchQuery = departureQuery,
            onSearchQueryChange = { query ->
                // Mise à jour de la requête de départ et gestion des suggestions
                onDepartureQueryChange(query)
                onShowSuggestionsChange(query.isNotEmpty() || isFromFieldFocused)
                isFromFieldFocused = true
                onShowRouteOptionsChange(false)
                onFocusChange(query.isNotEmpty())
                fromSearchJob?.cancel()
                fromSearchJob = coroutineScope.launch {
                    // Si la requête est vide, tenter de récupérer les suggestions basées sur la position actuelle
                    if (query.isEmpty()) {
                        if (viewModel._currentPosition.value == null) {
                            errorMessage = "Veuillez activer votre position ou remplir ce champ manuellement."
                        } else {
                            viewModel._currentPosition.value?.let { currentLocation ->
                                viewModel.fetchSuggestions("${currentLocation.latitude},${currentLocation.longitude}", true)
                            }
                        }
                    } else if (query.length >= 3) {
                        viewModel.fetchSuggestions(query, true)
                        errorMessage = null
                    } else {
                        viewModel.clearFromSuggestions()
                        errorMessage = null
                    }
                }
            },
            onSearchClick = {
                isFromFieldFocused = true
                onFocusChange(true)
                onShowSuggestionsChange(true)
            },
            onMenuClick = {},
            showMenuIcon = false,
            showRouteOptions = showRouteOptions, // Affichage des options de route
            placeholderText = "Position",
            leadingIcon = {
                // Icône à gauche du champ de recherche
                Icon(
                    imageVector = Icons.Default.NearMe,
                    contentDescription = "Départ",
                    modifier = Modifier.size(40.dp).padding(start = 15.dp),
                    tint = customPurple
                )
            },
            modifier = Modifier.fillMaxWidth().padding(top = 50.dp),
        )

        errorMessage?.let {
            Text(
                text = it,
                color = Color.Red,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 200.dp)
                    .align(Alignment.TopCenter)
            )
        }

        suggestionError?.let {
            ErrorMessage(
                message = it,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 200.dp)
                    .align(Alignment.TopCenter)
            )
        }
        // Affichage des suggestions ou des options de route en fonction de l'état
        Column(Modifier.fillMaxSize().padding(16.dp)) {
            if (showSuggestions && (departureQuery.isNotEmpty() || destinationQuery.isNotEmpty())) {
                val suggestions = if (isFromFieldFocused) fromSuggestions else toSuggestions

                // Liste des suggestions de lieu
                Box(Modifier
                    .fillMaxWidth()
                    .height(450.dp)
                    .offset(y = 110.dp)){
                    SuggestionsList(
                        suggestions = suggestions,
                        onPlaceSelected = { suggestion ->
                            // Sélection d'un lieu dans la liste des suggestions
                            viewModel.selectSuggestion(suggestion, isFromFieldFocused)
                            onPlaceSelected(suggestion)
                            val formatted = formatSuggestion(suggestion)
                            if (isFromFieldFocused) onDepartureQueryChange(formatted)
                            else onDestinationQueryChange(formatted)
                            onShowSuggestionsChange(false)
                            onShowRouteOptionsChange(true)
                            isFromFieldFocused = false
                            onFocusChange(false)
                        },
                        customPurple = customPurple,
                        isLoading = viewModel.suggestionsLoading.collectAsState().value
                    )
                }
            }
            // Affichage des options de route si sélectionnées
            if (showRouteOptions && !showSuggestions) {
                SwapButton(onSwapClick = {
                    viewModel.swapFromTo()
                    onSwapClick()
                })
            }
            // Affichage des options de route
            if (showRouteOptions) {
                if (viewModel.routeOptionsLoading.collectAsState().value) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 55.dp),
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
                } else {
                    RouteOptionsList(
                        viewModel = viewModel,
                        onRouteSelected = { routeType ->
                            onRouteSelected(routeType)
                            onShowRouteOptionsChange(false)
                            onShowSuggestionsChange(false)
                        },
                        modifier = Modifier.padding(top = 55.dp)
                    )
                }
            }
            // Affichage d'un message d'erreur s'il y en a
            if ((showRouteOptions || showSuggestions) && suggestionError != null) {
                ErrorMessage(
                    message = suggestionError!!,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                )
            }
        }
    }
}

// Bouton pour échanger les positions de départ et de destination
@Composable
private fun SwapButton(onSwapClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(top = 78.dp, end = 0.dp),
        horizontalArrangement = Arrangement.End,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.SyncAlt,
            contentDescription = "Sync Alt",
            modifier = Modifier
                .size(35.dp)
                .rotate(90f)
                .clickable(onClick = onSwapClick)
        )
    }
}

// Formatage de la suggestion de lieu
fun formatSuggestion(suggestion: SuggestionResponse): String {
    return buildString {
        suggestion.housenumber?.takeIf { it.isNotBlank() }?.let { append("$it ") }
        suggestion.name?.takeIf { it.isNotBlank() }?.let { append(it) }
        suggestion.city?.takeIf { it.isNotBlank() }?.let { city ->
            if (isNotEmpty()) append(", $city") else append(city)
        }
    }.trim()
}