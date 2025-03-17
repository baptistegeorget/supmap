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

Téléchargez le fichier juste [ici](https://ionissupinfo-my.sharepoint.com/:u:/g/personal/baptiste_georget_supinfo_com/EUhigqWPo-hPuZkBMBM2bnIB_zCmPv5cZh6K8BbXaoAk6g?e=nA368a), et placez le dans le dossier [routing-engine](./routing-engine/).

> _Vous pouvez ajouter n'importe quel fichier avec l'extension `.osm.pbf` dans ce dossier._

Ensuite, dupliquez le fichier [.env.example](.env.example) et renommez le en `.env`, puis suivez les instructions dans ce dernier.

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


## Contributeurs

- [Léo Bouffard](https://github.com/LeoBouffard)
- [Loise Talluau](https://github.com/Loisetal)
- [Mathieu Perrot](https://github.com/Mathieuprt)
- [Baptiste Georget](https://github.com/baptistegeorget)