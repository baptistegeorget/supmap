# SUPMAP

## Description

SUPMAP est une solution de navigation communautaire.

Liste des fonctionnalités :
- Naviguer en temps réel avec des itinéraires optimisés.
- Recevoir des alertes sur les conditions de circulation (bouchons, accidents, routes fermées).
- Signaler des incidents (accidents, embouteillages, contrôles policiers).
- Contribuer à la communauté en validant ou en infirmant des signalements faits par d'autres utilisateurs.
- Choisir un itinéraire en fonction de son coût (éviter les péages par exemple).

L'application est disponible via un site web et une application mobile (les fonctionnalités peuvent être différentes entre le site web et l'application mobile).

## Installation

### Configuration

Dupliquez le fichier [.env.example](.env.example) et renommez le en `.env`, puis suivez les instructions dans ce dernier.

### Déploiement

Une fois la configuration terminée, vous pouvez déployer la solution avec les commandes suivantes.

#### Production

```bash
docker-compose -f docker-compose.yaml up
```

#### Développement

```bash
docker-compose up
```

### Partie Mobile

### Prérequis
Avant de commencer, assurez-vous d'avoir :

- **Android Studio**
- **SDK Android 33** (API 33) installé
- **Clé API Google Maps** valide
- **Clé API GraphHopper** (optionnelle pour le développement)

#### 1. Ouvrez le projet dans Android Studio :
Lancez Android Studio et ouvrez le dossier du projet cloné.

#### 2. Synchronisez le projet avec Gradle
Une fois le projet ouvert, cliquez sur **Sync Now** dans la barre de notification d'Android Studio pour synchroniser les dépendances du projet.

#### 3. Configurez les clés API
Assurez-vous d'ajouter les clés API nécessaires dans votre fichier **local.properties** :
```bash
GOOGLE_CLIENT_ID=your_google_maps_id_key
NEXT_PUBLIC_API_BASE_URL=your_api_base_url
GRAPHHOPPER_BASE_URL=your_base_url_graphhopper
GRAPHHOPPER_API_KEY=your_graphhopper_api_key 
```

### 4. Exécutez l'application
Après avoir configuré les clés API, vous pouvez exécuter l'application sur un appareil Android ou un émulateur. Cliquez sur **Run** dans Android Studio pour installer et tester l'application sur votre appareil.


## Pour Aller Plus Loin
- [Documentation API GraphHopper](https://docs.graphhopper.com)
- [Guide Google Maps SDK](https://developers.google.com/maps/documentation)
- [Documentation technique du Projet](https://ionissupinfo-my.sharepoint.com/:w:/r/personal/baptiste_georget_supinfo_com/_layouts/15/Doc.aspx?sourcedoc=%7B6637DC9A-3F7F-4C5D-B448-8F1B6F902466%7D&file=Documentation%20technique.docx&action=default&mobileredirect=true)
- [Guide d'utilisation](https://ionissupinfo-my.sharepoint.com/:w:/r/personal/baptiste_georget_supinfo_com/_layouts/15/Doc.aspx?sourcedoc=%7BE4D45A2B-F436-42E3-AB9E-B063C050CE7A%7D&file=Guide%20utilisateurs.docx&action=default&mobileredirect=true)

## Contributeurs

- [Léo Bouffard](https://github.com/LeoBouffard)
- [Loise Talluau](https://github.com/Loisetal)
- [Mathieu Perrot](https://github.com/Mathieuprt)
- [Baptiste Georget](https://github.com/baptistegeorget)