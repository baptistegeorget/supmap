package com.supmap.viewModel.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.supmap.services.map.GoogleMapService
import com.supmap.services.map.OrientationService

class MapViewModelFactory(
    private val mapService: GoogleMapService,
    private val orientationService: OrientationService
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MapViewModel::class.java)) {
            return MapViewModel(mapService, orientationService) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}