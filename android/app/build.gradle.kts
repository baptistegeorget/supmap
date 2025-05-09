import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("com.google.android.libraries.mapsplatform.secrets-gradle-plugin") version "2.0.1"
}

android {
    namespace = "com.supmap"
    compileSdk = 35

    buildFeatures {
        buildConfig = true
        compose = true
    }

    defaultConfig {
        manifestPlaceholders += mapOf()
        applicationId = "com.supmap"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Chargement sécurisé des propriétés
        val localProperties = Properties().apply {
            try {
                load(rootProject.file("local.properties").inputStream())
            } catch (e: Exception) {
                logger.warn("Failed to load local.properties: ${e.message}")
            }
        }

        // Fonction helper pour récupérer les propriétés
        fun getLocalProperty(key: String) = localProperties.getProperty(key) ?: ""

        // Définition des clés
        manifestPlaceholders["GOOGLE_MAPS_API_KEY"] = getLocalProperty("GOOGLE_MAPS_API_KEY")

        // Configuration BuildConfig
        buildConfigField("String", "JWT_SECRET", "\"${getLocalProperty("JWT_SECRET")}\"")
        buildConfigField("String", "CRYPTO_KEY", "\"${getLocalProperty("CRYPTO_KEY")}\"")
        buildConfigField("String", "GRAPHHOPPER_API_KEY", "\"${getLocalProperty("GRAPHHOPPER_API_KEY")}\"")
        buildConfigField("String", "GRAPHHOPPER_BASE_URL", "\"${getLocalProperty("GRAPHHOPPER_BASE_URL")}\"")
        buildConfigField("String", "POSTGRES_USER", "\"${getLocalProperty("POSTGRES_USER")}\"")
        buildConfigField("String", "POSTGRES_PASSWORD", "\"${getLocalProperty("POSTGRES_PASSWORD")}\"")
        buildConfigField("String", "GOOGLE_CLIENT_ID", "\"${getLocalProperty("GOOGLE_CLIENT_ID")}\"")
        buildConfigField("String", "GOOGLE_CLIENT_SECRET", "\"${getLocalProperty("GOOGLE_CLIENT_SECRET")}\"")
        buildConfigField("String", "NEXT_PUBLIC_API_BASE_URL", "\"${getLocalProperty("NEXT_PUBLIC_API_BASE_URL")}\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.play.services.location)
    implementation(libs.androidx.room.ktx)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)

    // Dépendances de base
    implementation ("androidx.core:core-ktx:1.12.0")
    implementation ("androidx.appcompat:appcompat:1.6.1")
    implementation ("com.google.android.material:material:1.11.0")

    // Jetpack Compose
    implementation ("androidx.compose.ui:ui:1.6.0")
    implementation ("androidx.compose.material3:material3:1.2.0")
    implementation ("androidx.compose.ui:ui-tooling-preview:1.6.0")
    implementation ("androidx.activity:activity-compose:1.8.1")

    // Navigation Compose
    implementation("androidx.navigation:navigation-compose:2.4.0")

    // WebView pour afficher la carte
    implementation ("androidx.webkit:webkit:1.7.0")

    // Google Maps et services
    implementation("com.google.maps.android:maps-ktx:5.1.1")
    implementation("com.google.maps.android:maps-compose:2.11.4")
    implementation("com.google.android.gms:play-services-maps:18.2.0")
    implementation("com.google.android.gms:play-services-location:21.0.1")
    implementation("com.google.maps:google-maps-services:2.2.0")
    implementation("com.google.maps.android:android-maps-utils:2.2.1")

    // Authentification Google
    implementation("com.google.android.gms:play-services-auth:20.7.0")

    // Kotlin Coroutine Support
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4")

    // Retrofit pour les appels API
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // Data Store et Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.6.2")
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Accompanist pour les permissions et les insets
    implementation("com.google.accompanist:accompanist-permissions:0.31.1-alpha")
    implementation("com.google.accompanist:accompanist-insets:0.28.0")

    // OSMDroid pour les cartes OpenStreetMap (si utilisé)
    implementation("org.osmdroid:osmdroid-android:6.1.14")

    // Material Icons pour Compose
    implementation("androidx.compose.material:material-icons-extended:1.5.4")

    // Tests unitaires et UI
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)

    // Debugging Tools pour Compose
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)

    // Tests Android
    implementation("androidx.test:core-ktx:1.5.0")
}