package com.supmap.ui.map.searchItineraire

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.supmap.data.SuggestionResponse

@Composable
fun SuggestionsList(
    suggestions: List<SuggestionResponse>,
    onPlaceSelected: (SuggestionResponse) -> Unit,
    customPurple: Color,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false
) {
    Box(modifier = modifier.fillMaxSize()) {
        if (isLoading) {
            // Afficher le loader au centre
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(
                    color = customPurple,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Recherche en cours...",
                    color = customPurple
                )
            }
        } else if (suggestions.isEmpty()) {
            // Afficher un message si pas de résultats
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.SearchOff,
                    contentDescription = "Aucun résultat",
                    tint = Color.Gray,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Aucun résultat trouvé",
                    color = Color.Gray
                )
            }
        } else {
            // Affiche la liste des suggestions
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                itemsIndexed(suggestions) { index, suggestion ->
                    SuggestionItem(
                        suggestion = suggestion,
                        customPurple = customPurple,
                        onClick = { onPlaceSelected(suggestion) },
                    )
                }
            }
        }
    }
}

@Composable
fun SuggestionItem(
    suggestion: SuggestionResponse,
    customPurple: Color,
    onClick: () -> Unit,
) {
    // Formate une adresse lisible à partir des champs disponibles
    val formattedAddress = buildString {
        suggestion.housenumber?.takeIf { it.isNotBlank() }?.let { append("$it ") }
        suggestion.name?.takeIf { it.isNotBlank() }?.let { append(it) }
        suggestion.city?.takeIf { it.isNotBlank() }?.let { append(", $it") }
        suggestion.postcode?.takeIf { it.isNotBlank() }?.let { append(" $it") }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 12.dp)
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Icon(
                imageVector = Icons.Default.LocationOn,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = customPurple
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                // Nom principal du lieu
                Text(
                    text = suggestion.name ?: "",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Normal
                )
                // Adresse détaillée
                Row(
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = formattedAddress,
                        fontSize = 16.sp,
                        color = Color.Gray,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                }
            }
        }
        // Ligne de séparation
        Divider(
            color = Color.LightGray,
            thickness = 1.dp,
            modifier = Modifier.padding(top = 12.dp)
        )
    }
}