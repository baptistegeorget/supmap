package com.supmap.services.map

import android.content.Context
import android.Manifest
import android.content.pm.PackageManager
import android.os.Looper
import android.util.Log
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class GoogleMapService(val context: Context) {

    private var googleMap: GoogleMap? = null

    // Fournisseur de localisation avec accès aux services de Google
    val fusedLocationClient: FusedLocationProviderClient by lazy {
        LocationServices.getFusedLocationProviderClient(context)
    }

    // Configuration de la requête de localisation
    private val locationRequest: LocationRequest by lazy {
        LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000).apply {
            setMinUpdateIntervalMillis(5000)
            setMinUpdateDistanceMeters(10f)
            setWaitForAccurateLocation(true)
        }.build()
    }

    // Tente de récupérer la localisation actuelle de l'utilisateur
    @Throws(SecurityException::class)
    suspend fun getCurrentLocation(): LatLng? {
        return try {
            if (!hasLocationPermission()) {
                Log.w("GoogleMapService", "Permissions de localisation manquantes")
                throw SecurityException("Location permission not granted")
            }

            // On essaie d'abord d'obtenir une localisation fraîche, sinon la dernière connue
            getFreshLocation() ?: getLastKnownLocation().also {
                Log.d("GoogleMapService", "Fallback sur dernière localisation connue: $it")
            }
        } catch (e: SecurityException) {
            Log.e("GoogleMapService", "Exception de sécurité dans getCurrentLocation", e)
            throw e
        } catch (e: Exception) {
            Log.e("GoogleMapService", "Erreur lors de la récupération de la localisation", e)
            null
        }
    }

    // Récupère une localisation fraîche si possible
    private suspend fun getFreshLocation(): LatLng? = suspendCancellableCoroutine { cont ->
        if (!hasLocationPermission()) {
            cont.resume(null)
            return@suspendCancellableCoroutine
        }

        val cancellationToken = CancellationTokenSource()

        try {
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                cancellationToken.token
            ).addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    task.result?.let { loc ->
                        val latLng = LatLng(loc.latitude, loc.longitude)
                        Log.d("GoogleMapService", "Localisation fraîche obtenue: $latLng")
                        cont.resume(latLng)
                    } ?: run {
                        Log.w("GoogleMapService", "Localisation fraîche nulle")
                        cont.resume(null)
                    }
                } else {
                    Log.w("GoogleMapService", "Tâche de localisation non réussie")
                    cont.resume(null)
                }
            }
        } catch (e: SecurityException) {
            Log.e("GoogleMapService", "Permission manquante pour getFreshLocation", e)
            cont.resumeWithException(e)
        } catch (e: Exception) {
            Log.e("GoogleMapService", "Erreur lors de getFreshLocation", e)
            cont.resume(null)
        }

        cont.invokeOnCancellation { cancellationToken.cancel() }
    }

    // Récupère la dernière localisation connue (peut être obsolète)
    private suspend fun getLastKnownLocation(): LatLng? = suspendCancellableCoroutine { cont ->
        if (!hasLocationPermission()) {
            cont.resume(null)
            return@suspendCancellableCoroutine
        }

        try {
            fusedLocationClient.lastLocation.addOnCompleteListener { task ->
                val location = task.result
                if (location != null) {
                    val latLng = LatLng(location.latitude, location.longitude)
                    Log.d("GoogleMapService", "Dernière localisation connue: $latLng")
                    cont.resume(latLng)
                } else {
                    Log.w("GoogleMapService", "Aucune dernière localisation disponible")
                    cont.resume(null)
                }
            }
        } catch (e: SecurityException) {
            Log.e("GoogleMapService", "Exception de sécurité dans getLastKnownLocation", e)
            cont.resumeWithException(e)
        } catch (e: Exception) {
            Log.e("GoogleMapService", "Erreur lors de getLastKnownLocation", e)
            cont.resume(null)
        }

    }

    // Démarre les mises à jour continues de la localisation avec un callback
    @Throws(SecurityException::class)
    fun startLocationUpdates(callback: (LatLng) -> Unit) {
        try {
            if (!hasLocationPermission()) {
                Log.w("GoogleMapService", "Permissions de localisation non accordées")
                throw SecurityException("Location permission not granted")
            }

            val locationCallback = object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    if (!hasLocationPermission()) {
                        Log.w("GoogleMapService", "Permissions révoquées pendant l'utilisation")
                        return
                    }
                    result.lastLocation?.let {
                        callback(LatLng(it.latitude, it.longitude))
                    } ?: Log.w("GoogleMapService", "Dernière localisation non disponible")
                }
            }

            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper() // Utilisez le Looper principal
            ).addOnFailureListener { e ->
                Log.e("GoogleMapService", "Échec de la demande de mise à jour de localisation", e)
            }

        } catch (e: SecurityException) {
            Log.e("GoogleMapService", "Erreur de sécurité lors du démarrage des mises à jour", e)
            throw e
        } catch (e: Exception) {
            Log.e("GoogleMapService", "Erreur inattendue lors du démarrage des mises à jour", e)
            throw e
        }
    }

    // Vérifie si les permissions de localisation sont accordées
    fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED || ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    // Ajoute un marqueur à la carte, si elle est disponible
    fun addMarker(options: MarkerOptions): Marker? {
        Log.d("IncidentDebug", "Appel à addMarker sur la GoogleMap avec options: ${options.title}")
        return googleMap?.addMarker(options).also {
            if (it == null) Log.e("IncidentDebug", "Marker non ajouté (googleMap=null?)")
        }
    }

    // Définit la carte GoogleMap utilisée et la configure
    fun setMap(map: GoogleMap) {
        this.googleMap = map
        configureMap()
    }

    // Configure les paramètres de la carte (UI, type de carte, etc.)
    private fun configureMap() {
        googleMap?.apply {
            isBuildingsEnabled = false
            isTrafficEnabled = false
            mapType = GoogleMap.MAP_TYPE_NORMAL
            isIndoorEnabled = false

            uiSettings.apply {
                isCompassEnabled = false
                isZoomControlsEnabled = false
                isMyLocationButtonEnabled = false
                isRotateGesturesEnabled = true
                isScrollGesturesEnabled = true
                isZoomGesturesEnabled = true
            }
        }
    }
}