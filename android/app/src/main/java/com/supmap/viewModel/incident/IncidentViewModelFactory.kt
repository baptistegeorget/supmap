package com.supmap.viewModel.incident

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.supmap.services.incidents.IncidentService
import com.supmap.viewModel.auth.AuthViewModel
import com.supmap.viewmodels.IncidentViewModel

class IncidentViewModelFactory(
    private val incidentService: IncidentService,
    private val authViewModel: AuthViewModel,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(IncidentViewModel::class.java)) {
            return IncidentViewModel(incidentService, authViewModel) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}