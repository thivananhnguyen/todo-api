# Tableau de metriques - Chapitre 10

Ce document centralise les mesures de performance et d optimisation relevees pour la Partie 1.

## 1) Resultats mesures

| Metrique | Valeur |
|---|---:|
| API image size | 57,861,330 bytes (~55.2 MB) |
| API layer count | 9 |
| Stats image size | 51,336,533 bytes (~49.0 MB) |
| Stats layer count | 9 |
| API cold build | 5,183 ms |
| API warm build | 993 ms |
| Stats cold build | 10,891 ms |
| Stats warm build | 893 ms |
| API startup to first health | 7,112 ms |
| Stats startup to first health | 7,813 ms |

## 2) Commandes de reproduction

1. Mesure build cold/warm:

   docker build --no-cache -t todo-api:measure .
   docker build -t todo-api:measure .
   docker build --no-cache -t todo-stats-api:measure ./stats_api
   docker build -t todo-stats-api:measure ./stats_api

2. Mesure taille + nombre de layers:

   docker image inspect nguyenthivananh/todo-api:1.0.0 --format '{{.Size}} {{len .RootFS.Layers}}'
   docker image inspect nguyenthivananh/todo-stats-api:1.0.0 --format '{{.Size}} {{len .RootFS.Layers}}'

3. Mesure startup:

   docker compose -f docker-compose.prod.yml up -d
   curl --retry 20 --retry-all-errors --retry-delay 1 -i http://localhost:3000/health
   curl --retry 20 --retry-all-errors --retry-delay 1 -i http://localhost:8000/health
   docker compose -f docker-compose.prod.yml down

## 3) Analyse

1. Le Dockerfile multi-stage de l API maintient une image runtime compacte.
2. Le service Python reste leger avec python:3.12-slim et pip sans cache.
3. Le cache Docker reduit fortement le temps de build warm.
4. Le temps de readiness reste inferieur a 8 secondes pour les deux services sur la machine de test.

## 4) Limites et interpretation

1. Les mesures dependent de la machine locale, du cache present et de l etat reseau.
2. Pour une comparaison stricte, relancer les mesures plusieurs fois et conserver une moyenne.
