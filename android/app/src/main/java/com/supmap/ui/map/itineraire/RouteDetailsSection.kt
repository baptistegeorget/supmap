package com.supmap.ui.map.itineraire

import RouteBanner
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supmap.data.SelectedRouteInfo
import com.supmap.viewModel.route.RouteViewModel

@Composable
fun RouteDetailsSection(
    customPurple: Color,
    customOrange: Color,
    showQuitButton: Boolean,
    onQuitClick: () -> Unit,
    onOptionsClick: () -> Unit,
    routeInfo: SelectedRouteInfo,
    viewModel: RouteViewModel,
    modifier: Modifier = Modifier
) {
    val nextInstruction by viewModel.nextInstruction.collectAsState()
    val distanceToNext by viewModel.distanceToNextTurn.collectAsState()

    Column(
        modifier = modifier.fillMaxWidth()
    ) {
        // Affiche le bandeau avec l’instruction suivante
        RouteBanner(
            modifier = Modifier
                .fillMaxWidth()
                .background(customPurple)
                .padding(16.dp),
            distance = routeInfo.distance,
            streetName = nextInstruction?.street_name ?: routeInfo.currentStreet,
            instruction = nextInstruction?.text ?: routeInfo.currentInstruction,
            sign = nextInstruction?.sign,
            distanceToNext = distanceToNext,
        )

        Spacer(modifier = Modifier.weight(1f))

        // Section inférieure contenant les infos de trajet et les actions
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 12.dp)
            ) {
                // Affichage des informations clés (heure d’arrivée, distance)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        // Heure d'arrivée prévue
                        Column {
                            Text(
                                text = routeInfo.arrivalTime.replace("h", ":"),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "arrivé",
                                fontSize = 16.sp,
                                color = Color.Gray,
                            )
                        }
                        // Temps estimé
                        Column {
                            Text(
                                text = routeInfo.duration.replace("h", ":"),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (routeInfo.duration.contains(":")) "h" else "",
                                fontSize = 16.sp,
                                color = Color.Gray,
                            )
                        }
                        // Distance restante
                        Column {
                            Text(
                                text = routeInfo.distance.split(" ")[0],
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = routeInfo.distance.split(" ").getOrNull(1) ?: "",
                                fontSize = 16.sp,
                                color = Color.Gray,
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(18.dp))

                    // Bouton pour basculer l'affichage, afficher ou cacher le bouton "Quitter")
                    IconButton(
                        onClick = onOptionsClick,
                        modifier = Modifier
                            .size(30.dp)
                            .background(customPurple, CircleShape)
                    ) {
                        Icon(
                            imageVector = if (showQuitButton) Icons.Filled.ExpandMore else Icons.Filled.ExpandLess,
                            contentDescription = "Options",
                            tint = Color.White,
                            modifier = Modifier.size(35.dp)
                        )
                    }
                }

                // Bouton pour quitter l'itinéraire, affiché si showQuitButton est vrai
                if (showQuitButton) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            onQuitClick()
                            viewModel.resetMapState() // Réinitialise l’état de la carte
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 55.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = customOrange),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "Quitter",
                            color = Color.White,
                            fontSize = 18.sp,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}