package com.supmap.services.search

import com.supmap.data.CreateRouteRequest
import com.supmap.data.GeocodingResponse
import com.supmap.data.RouteResponse
import retrofit2.Response
import retrofit2.http.*

// Interface pour la recherche d'adresses et la gestion des routes
interface SearchAPIService {

    // Recherche de suggestions d'adresses via geocoding
    @GET("geocode")
    suspend fun getSuggestions(
        @Query("q") query: String,
        @Query("locale") locale: String = "fr",
        @Query("limit") limit: Int = 5,
        @Query("key") apiKey: String
    ): Response<GeocodingResponse>

    // Création d'un itinéraire pour un utilisateur
    @POST("users/{userId}/routes")
    @Headers(
        "Content-Type: application/json",
        "Accept: application/json"
    )
    suspend fun createRouteForUser(
        @Path("userId") userId: String,
        @Body request: CreateRouteRequest,
        @Header("Authorization") authToken: String
    ): Response<RouteResponse>

    // Récupération d’un itinéraire spécifique
    @GET("users/{userId}/routes/{routeId}")
    suspend fun getRouteById(
        @Path("userId") userId: String,
        @Path("routeId") routeId: String,
        @Header("Authorization") authToken: String
    ): Response<RouteResponse>
}