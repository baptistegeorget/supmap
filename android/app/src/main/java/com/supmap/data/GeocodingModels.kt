package com.supmap.data

data class GeocodingResponse(
    val hits: List<SuggestionResponse>
)

data class SuggestionResponse(
    val name: String,
    val city: String,
    val housenumber: String?,
    val postcode: String?,
    val point: PointDto
) {
    data class PointDto(
        val lat: Double,
        val lng: Double
    )
}

data class SuggestionWithDistance(
    val suggestion: SuggestionResponse,
    val distance: Double
)