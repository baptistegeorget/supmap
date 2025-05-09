package com.supmap.ui.map

import com.google.android.gms.maps.model.LatLng

fun decodePolyline(encoded: String): List<LatLng> {
    val poly = ArrayList<LatLng>()
    var index = 0
    var lat = 0
    var lng = 0

    val precision = 1e5

    while (index < encoded.length) {
        var b: Int
        var shift = 0
        var result = 0
        // Décodage de la latitude
        do {
            // Récupération du caractère encodé et soustraction de 63 pour obtenir un entier
            b = encoded[index++].code - 63
            result = result or (b and 0x1f shl shift)
            shift += 5
        } while (b >= 0x20)

        // Traitement des bits pour obtenir le delta de la latitude
        val dlat = if (result and 1 != 0) (result shr 1).inv() else result shr 1
        lat += dlat

        // Décodage de la longitude
        shift = 0
        result = 0
        do {
            b = encoded[index++].code - 63
            result = result or (b and 0x1f shl shift)
            shift += 5
        } while (b >= 0x20)

        // Traitement des bits pour obtenir le delta de la longitude
        val dlng = if (result and 1 != 0) (result shr 1).inv() else result shr 1
        lng += dlng

        // Ajouter la paire de coordonnées décodée à la liste
        poly.add(LatLng(lat / precision, lng / precision))
    }

    return poly // Retourne la liste des points LatLng
}