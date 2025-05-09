package com.supmap.data

import com.google.android.gms.maps.model.LatLng
import java.util.UUID

data class IncidentRequest(
    val type: String,
    val location: List<Double>,
    val description: String? = null,
    val iconRes: Int? = null,
)

data class IncidentResponse(
    val id: String,
    val type: String,
    val latitude: Double,
    val longitude: Double,
    val createdAt: String,
    val userId: String,
    val votes: Int = 0,
    val userVote: Int? = null,
    val location: GeoJsonPoint,
)

data class Incident(
    val id: String = UUID.randomUUID().toString(),
    val type: String,
    val location: LatLng,
    val iconRes: Int? = null,
    val severity: String,
    val description: String?,
    val timestamp: Long
)

data class GeoJsonPoint(
    val type: String,
    val coordinates: List<Double> // [longitude, latitude]
)
