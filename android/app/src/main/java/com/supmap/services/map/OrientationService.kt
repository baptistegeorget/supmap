package com.supmap.services.map

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class OrientationService(context: Context) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    // Capteurs nécessaires pour le calcul de l'orientation
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)


    // Orientation exposée en temps réel (angle en degrés)
    private val _orientation = MutableStateFlow(0f)
    val orientation: StateFlow<Float> = _orientation

    // Données brutes des capteurs
    private val accelerometerData = FloatArray(3)
    private val magnetometerData = FloatArray(3)

    // Matrices pour les calculs de rotation et d'orientation
    private val rotationMatrix = FloatArray(9)
    private val orientationAngles = FloatArray(3)

    // Active les capteurs pour commencer à recevoir les mises à jour d'orientation
    fun start() {
        Log.d("OrientationService", "Enregistrement des capteurs...")
        sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
        sensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_GAME)
    }

    // Désactive les capteurs pour économiser les ressources
    fun stop() {
        Log.d("OrientationService", "Désenregistrement des capteurs.")
        sensorManager.unregisterListener(this)
    }

    // Méthode appelée à chaque mise à jour d’un capteur
    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> System.arraycopy(event.values, 0, accelerometerData, 0, 3)
            Sensor.TYPE_MAGNETIC_FIELD -> System.arraycopy(event.values, 0, magnetometerData, 0, 3)
        }

        try {
            // Calcul de la matrice de rotation à partir des deux capteurs
            val hasRotation = SensorManager.getRotationMatrix(rotationMatrix, null, accelerometerData, magnetometerData)
            if (hasRotation) {
                SensorManager.getOrientation(rotationMatrix, orientationAngles)
                val degrees = Math.toDegrees(orientationAngles[0].toDouble()).toFloat()
                val normalized = (degrees + 360) % 360
                _orientation.value = normalized

            } else {
                Log.w("OrientationService", "Échec du calcul de la matrice de rotation.")
            }
        } catch (e: Exception) {
            Log.e("OrientationService", "Erreur lors du calcul de l'orientation", e)
        }
    }

    // Méthode appelée quand la précision d’un capteur change (pas utilisée ici)
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}