package com.supmap.data

import com.google.gson.annotations.SerializedName

data class CreateRouteRequest(
    @SerializedName("profile") val profile: String,
    @SerializedName("points") val points: List<List<Double>>
)

data class RouteResponse(
    val id: String,
    val profile: String,
    val distance: Double,
    val duration: Long,
    val arrivalTime: Long,
    @SerializedName("graphhopper_response")
    val graphhopperResponse: GraphHopperResponse?
)

data class GraphHopperResponse(
    val paths: List<RoutePath>
)

data class RoutePath(
    val distance: Double,
    val time: Long,
    val points: String,
    val instructions: List<Instruction>?
)

data class SelectedRouteInfo(
    val distance: String,
    val duration: String,
    val arrivalTime: String,
    val currentInstruction: String,
    val currentStreet: String,
    val distanceToNext: String,
    val allInstructions: List<Instruction>,
    val nextInstructionIndex: Int,
    val rawDistanceToNext: Double,
    val rawDistance: Double,
)

data class Instruction(
    val text: String,
    val distance: Double,
    val time: Long,
    val interval: List<Int>,
    val sign: Int?,
    val street_name: String?,
    val street_ref: String?,
)
