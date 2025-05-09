package com.supmap.ui.map.searchItineraire

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SearchBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onSearchClick: () -> Unit,
    onMenuClick: () -> Unit,
    showMenuIcon: Boolean,
    showRouteOptions: Boolean,
    leadingIcon: @Composable (() -> Unit)? = null,
    placeholderText: String = "Rechercher un endroit...",
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
            .padding(end = if (showRouteOptions) 35.dp else 0.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Affichage conditionnel de l'icône de menu
        if (showMenuIcon) {
            IconButton(
                onClick = onMenuClick,
                modifier = Modifier.padding(end = 8.dp)
            ) {
                Icon(Icons.Filled.Menu, contentDescription = "Menu")
            }
        }

        // Champ de recherche principal avec un fond
        Box(
            modifier = Modifier
                .weight(1f)
                .background(
                    Color(0xFFF3F2F3),
                    shape = MaterialTheme.shapes.medium
                )
                .heightIn(max = 45.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Icône à l'intérieur du champ
                if (showRouteOptions) {
                    leadingIcon?.invoke()
                }

                // Champ de texte pour la recherche
                BasicTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    modifier = Modifier
                        .weight(1f)
                        .padding(vertical = 12.dp, horizontal = 20.dp)
                        .clickable(onClick = onSearchClick),
                    singleLine = true,
                    decorationBox = { innerTextField ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                        ) {
                            // Affichage du texte de placeholder si la requête est vide
                            if (searchQuery.isEmpty()) {
                                Text(
                                    text = placeholderText,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    fontSize = 16.sp,
                                )
                            }
                            innerTextField() // Affichage du texte saisi dans le champ
                        }
                    }
                )
            }
        }
    }
}