package com.supmap.viewModel.route

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.supmap.services.search.SearchAPIService
import com.supmap.viewModel.settings.SettingsViewModel
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.viewModel.map.MapViewModel
import com.supmap.viewmodels.IncidentViewModel

class RouteViewModelFactory(
    private val searchService: SearchAPIService,
    private val authViewModel: AuthViewModel,
    private val appContext: Context,
    private val mapViewModel: MapViewModel,
    private val settingsViewModel: SettingsViewModel,
    private val incidentViewModel: IncidentViewModel
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return RouteViewModel(
            searchService,
            authViewModel,
            appContext,
            mapViewModel,
            settingsViewModel,
            incidentViewModel
        ) as T
    }
}