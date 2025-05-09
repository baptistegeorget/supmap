package com.supmap.data

import com.google.android.gms.maps.model.LatLng

data class LatLngDto(
    val lat: Double,
    val lng: Double
)

fun LatLngDto.toLatLng() = LatLng(lat, lng)