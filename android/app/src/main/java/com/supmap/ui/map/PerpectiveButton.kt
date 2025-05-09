package com.supmap.ui.map

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallSplit
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

// Un bouton permettant de basculer entre les vues 2D et 3D
@Composable
fun PerspectiveButton(
    isPerspectiveView: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(50.dp)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (isPerspectiveView)
                Icons.Default.CallSplit  // Icône de carte par défaut pour 2D
            else
                Icons.Default.MyLocation,  // Icône 3D par défaut
            contentDescription = if (isPerspectiveView) "Vue 2D" else "Vue 3D",
            modifier = Modifier.size(45.dp),
            tint = Color(0xFF6A4C93)
        )
    }
}