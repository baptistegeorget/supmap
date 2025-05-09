import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Merge
import androidx.compose.material.icons.filled.RampLeft
import androidx.compose.material.icons.filled.RampRight
import androidx.compose.material.icons.filled.RoundaboutLeft
import androidx.compose.material.icons.filled.Straight
import androidx.compose.material.icons.filled.TurnLeft
import androidx.compose.material.icons.filled.TurnRight
import androidx.compose.material.icons.filled.TurnSharpLeft
import androidx.compose.material.icons.filled.UTurnRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun RouteBanner(
    modifier: Modifier = Modifier,
    distance: String,
    streetName: String,
    instruction: String,
    sign: Int? = null,
    distanceToNext: Double? = null
) {
    // Sélection de l'icône en fonction du type d'instruction (code OSM)
    val arrowIcon = when (sign) {
        -3 -> Icons.Default.TurnSharpLeft
        -2 -> Icons.Default.TurnLeft
        -1 -> Icons.Default.UTurnRight
        0 -> Icons.Default.Straight
        1 -> Icons.Default.TurnRight
        2 -> Icons.Default.TurnRight
        3 -> Icons.Default.RampRight
        4 -> Icons.Default.Flag
        5 -> Icons.Default.RampLeft
        6 -> Icons.Default.RoundaboutLeft
        7, -7 -> Icons.Default.Merge
        else -> Icons.Default.ArrowUpward // Icône par défaut
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            // Affiche l'icône représentant la manœuvre
            Icon(
                imageVector = arrowIcon,
                contentDescription = "Instruction",
                tint = Color.White,
                modifier = Modifier.size(70.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.fillMaxWidth()
            ) {
                // Instruction textuelle principale
                Text(
                    text = instruction,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                // Affiche la distance jusqu'à la prochaine instruction si disponible, sinon distance actuelle
                distanceToNext?.let { dist ->
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = "Dans ${"%.1f".format(dist/1000)} km",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }
                } ?: Text(
                    text = distance,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                // Affiche le nom de la rue concernée
                Text(
                    text = streetName,
                    fontSize = 18.sp,
                    color = Color.White
                )
            }
        }
    }
}