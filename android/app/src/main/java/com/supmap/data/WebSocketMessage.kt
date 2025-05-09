package com.supmap.data

data class WebSocketLocationUpdate(
    val location: List<Double>
)

data class WebSocketNearIncidents(
    val nearIncidents: List<WebSocketIncident>
)

data class WebSocketIncident(
    val id: String,
    val type: String,
    val location: WebSocketIncidentLocation,
    val created_on: String,
    val created_by: String
)

data class WebSocketIncidentLocation(
    val type: String,
    val coordinates: List<Double>
)