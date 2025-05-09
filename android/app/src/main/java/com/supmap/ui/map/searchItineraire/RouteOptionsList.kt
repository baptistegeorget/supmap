package com.supmap.ui.map.searchItineraire

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import com.supmap.data.RouteOptionsResponse
import com.supmap.viewModel.route.RouteViewModel

@Composable
fun RouteOptionsList(
    viewModel: RouteViewModel,
    onRouteSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val routeOptions by viewModel.routeOptions.collectAsState()
    val isLoading by viewModel.routeOptionsLoading.collectAsState()

    Box(modifier = modifier.fillMaxSize()) {
        if (isLoading) {
            // Affichage d'un loader pendant le chargement des itinéraires
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(
                    color = Color(0xFF6A4C93),
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Calcul des itinéraires...",
                    color = Color(0xFF6A4C93)
                )
            }
        } else if (routeOptions.isEmpty() && !isLoading) {
            // Aucun résultat
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.DirectionsOff,
                    contentDescription = "Aucun itinéraire",
                    tint = Color.Gray,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Aucun itinéraire disponible",
                    color = Color.Gray
                )
            }
        } else {
            // Affichage de la liste des itinéraires disponibles
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(routeOptions) { route ->
                    // Affichage de chaque option d'itinéraire
                    RouteOptionItem(
                        route = route,
                        onRouteSelected = {
                            // Sélection de l'itinéraire et démarrage de la navigation en temps réel via WebSocket
                            val selectedIndex = route.type.removePrefix("Itinéraire ").toInt() - 1
                            viewModel.selectRoute(selectedIndex)
                            viewModel.startWebSocketNavigation(
                                routeId = route.id,
                                pathIndex = selectedIndex,
                            )
                            onRouteSelected(route.type)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun RouteOptionItem(
    route: RouteOptionsResponse.RouteOption,
    onRouteSelected: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onRouteSelected(route.type) }
            .padding(vertical = 12.dp, horizontal = 16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = route.type, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Text(text = route.duration, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        }

        Row(
            modifier = Modifier.padding(start = 9.dp, top = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "Arrivée à ${route.arrivalTime}", fontSize = 16.sp, color = Color.Gray)
            Spacer(modifier = Modifier.weight(1f))
            Text(text = route.distance, fontSize = 16.sp, color = Color.Gray)
        }

        Divider(
            color = Color.LightGray,
            thickness = 1.dp,
            modifier = Modifier.padding(top = 15.dp)
        )
    }
}
