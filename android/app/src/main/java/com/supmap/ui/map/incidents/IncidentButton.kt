package com.supmap.ui.map.incidents

import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import com.supmap.R
import com.supmap.viewModel.map.MapViewModel
import com.supmap.viewmodels.IncidentViewModel

@Composable
fun IncidentButton(
    viewModel: IncidentViewModel,
    mapViewModel: MapViewModel,
    showIncidentMenu: Boolean,
    onIncidentClick: () -> Unit,
    onDismiss: () -> Unit,
    bottomOffset: Dp
) {
    val currentLocation by mapViewModel.userLocation.collectAsState()
    val context = LocalContext.current
    val reportIncidents by viewModel.reportIncidents.collectAsState()

    // Lorsqu'un incident est signalé, on ajoute son marqueur sur la carte
    LaunchedEffect(reportIncidents) {
        Log.d("IncidentDebug", "LaunchedEffect triggered for reportedIncidents = $reportIncidents")
        reportIncidents.forEach { incident ->
            Log.d("IncidentDebug", "Incident reporté: ${incident.type} @${incident.location}, iconRes=${incident.iconRes}")

            if (incident.iconRes != null) {
                val icon = viewModel.getScaledIcon(context, incident.iconRes)

                mapViewModel.addIncidentMarker(
                    position = incident.location,
                    type = incident.type,
                    id = incident.id,
                    iconRes = icon
                )
            } else {
                Log.e("IncidentDebug", "Icon resource is null for incident: ${incident.type}")
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Bouton en bas à droite de l'écran
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = bottomOffset)
                .offset(x = 6.dp)
        ) {
            // Icône pour déclencher le menu des incidents
            Box(
                modifier = Modifier
                    .size(70.dp)
                    .clickable(onClick = onIncidentClick)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_triangle),
                    contentDescription = "Signaler un incident",
                    modifier = Modifier.size(70.dp)
                )
            }
            // Menu déroulant avec les types d'incidents disponibles
            DropdownMenu(
                expanded = showIncidentMenu,
                onDismissRequest = onDismiss,
                modifier = Modifier.width(190.dp).background(Color.White)
            ) {
                listOf(
                    "Embouteillage" to R.drawable.embouteillage,
                    "Police" to R.drawable.police,
                    "Accident" to R.drawable.accident,
                    "Route fermée" to R.drawable.route_fermer,
                    "Obstacle" to R.drawable.obstacle
                ).forEach { (incident, iconRes) ->
                    DropdownMenuItem(
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Image(
                                    painter = painterResource(id = iconRes),
                                    contentDescription = null,
                                    modifier = Modifier.size(30.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = incident, fontSize = 16.sp)
                            }
                        },
                        onClick = {
                            // On signale l'incident à la position actuelle si dispo
                            currentLocation?.let { location ->
                                viewModel.reportIncident(
                                    type = incident,
                                    location = location,
                                    description = null,
                                    iconRes = iconRes
                                )
                                Toast.makeText(
                                    context,
                                    "Incident signalé: $incident",
                                    Toast.LENGTH_SHORT
                                ).show()
                            } ?: run {
                                Toast.makeText(
                                    context,
                                    "Position indisponible",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                            onDismiss()
                        }
                    )
                }
            }
        }
    }
}