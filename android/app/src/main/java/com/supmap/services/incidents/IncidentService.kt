package com.supmap.services.incidents

import com.supmap.data.IncidentRequest
import com.supmap.data.IncidentResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.Headers
import retrofit2.http.POST
import retrofit2.http.Path

// Interface pour signaler un incident utilisateur
interface IncidentService {

    // Signale un incident pour un utilisateur donné
    @POST("users/{userId}/incidents")
    @Headers("Content-Type: application/json")
    suspend fun reportUserIncident(
        @Path("userId") userId: String,
        @Body request: IncidentRequest,
        @Header("Authorization") authToken: String
    ): Response<IncidentResponse>
}