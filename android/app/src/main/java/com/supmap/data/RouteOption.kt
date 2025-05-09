package com.supmap.data

data class RouteOptionsResponse(
    val paths: List<Path>,
    val info: RouteInfo
) {
    data class Path(
        val points: String,
        val time: Long?,
        val distance: Double?
    )

    data class RouteInfo(
        val copyrights: List<String>,
        val took: Long
    )

    data class RouteOption(
        val id: String,
        val type: String,
        val duration: String,
        val distance: String,
        val arrivalTime: String,
    )
}
