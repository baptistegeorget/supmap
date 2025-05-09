package com.supmap.services

import com.supmap.services.auth.AuthApiService
import com.supmap.services.profile.ProfileApiService
import com.supmap.services.search.SearchAPIService
import com.supmap.BuildConfig
import com.supmap.services.incidents.IncidentService
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    const val LOCAL_BASE_URL = BuildConfig.NEXT_PUBLIC_API_BASE_URL
    private const val GRAPHHOPPER_BASE_URL = BuildConfig.GRAPHHOPPER_BASE_URL
    private const val GOOGLE_MAPS_BASE_URL = BuildConfig.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const val WS_BASE_URL = "ws://10.0.2.2:8000/"

    private fun createOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor { chain ->
                val original = chain.request()
                val request = original.newBuilder()
                    .header("X-Device-Type", "mobile") // Spécifie que la requête vient d’un appareil mobile
                    .header("Accept", "application/json") // Attend des réponses JSON
                    .header("Content-Type", "application/json") // Envoie des requêtes JSON
                    .method(original.method, original.body)
                    .build()
                chain.proceed(request)
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    // Client Retrofit pour le service d'authentification
    val api: AuthApiService by lazy {
        Retrofit.Builder()
            .baseUrl(LOCAL_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(createOkHttpClient())
            .build()
            .create(AuthApiService::class.java)
    }

    // Client Retrofit pour la gestion du profil utilisateur
    val profileService: ProfileApiService by lazy {
        Retrofit.Builder()
            .baseUrl(LOCAL_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(createOkHttpClient())
            .build()
            .create(ProfileApiService::class.java)
    }

    // Client Retrofit pour les recherches d'adresses ou de lieux via GraphHopper
    val searchService: SearchAPIService by lazy {
        Retrofit.Builder()
            .baseUrl(GRAPHHOPPER_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(createOkHttpClient())
            .build()
            .create(SearchAPIService::class.java)
    }

    // Client Retrofit pour les services d'itinéraire utilisant l'API locale
    val routeService: SearchAPIService by lazy {
        Retrofit.Builder()
            .baseUrl(LOCAL_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(createOkHttpClient())
            .build()
            .create(SearchAPIService::class.java)
    }

    // Client Retrofit pour les services liés aux incidents
    val incidentService: IncidentService by lazy {
        Retrofit.Builder()
            .baseUrl(LOCAL_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(createOkHttpClient())
            .build()
            .create(IncidentService::class.java)
    }
}