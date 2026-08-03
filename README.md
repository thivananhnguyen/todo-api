# Todo API - README complet (Partie 1)

Projet fil rouge de la formation DevOps/Docker: API Todo en Node.js, persistence PostgreSQL, orchestration Docker Compose, service Python de statistiques, publication des images sur Docker Hub, et mesures d optimisation.

## 1) Objectif pedagogique

Ce depot couvre toute la Partie 1 du parcours:

1. API CRUD robuste
2. Dockerfile production
3. PostgreSQL + volume
4. Network isolation
5. Configuration externe (.env)
6. Docker Compose complet
7. Service Python stats-api
8. Publication registry + redeploy sans source
9. Mesures et optimisation

## 2) Stack technique

1. Node.js 22 + Express 5
2. PostgreSQL 16
3. Python 3.12 + FastAPI + psycopg2
4. Docker + Docker Compose
5. Adminer (inspection manuelle DB)

## 3) Architecture du projet

Principaux fichiers:

1. src/app.js: assemblage Express + middleware + routes
2. src/server.js: bootstrap serveur + init schema DB
3. src/config/env.js: validation stricte des variables d environnement
4. src/models/task.js: CRUD SQL + initialisation table tasks
5. src/controllers/tasksController.js: logique HTTP
6. src/middleware/taskValidation.js: validation create/update
7. src/middleware/errorHandler.js: format JSON d erreur unifie
8. docker-compose.yml: stack dev (build local)
9. docker-compose.prod.yml: stack prod (images publiees)
10. stats_api/main.py: service Python /health + /stats

## 4) Contrat API

### Endpoint sante

1. GET /health

### Endpoints Todo (prefixe /api/tasks)

1. POST /api/tasks
2. GET /api/tasks
3. GET /api/tasks/:id
4. PUT /api/tasks/:id
5. DELETE /api/tasks/:id

### Modele Task

1. id: UUID string
2. description: string non vide, max 1000 caracteres
3. status: todo | in-progress | done
4. createdAt: ISO timestamp
5. updatedAt: ISO timestamp

### Format erreur

Toutes les erreurs renvoient un JSON stable:

1. error: message lisible

Cas geres explicitement:

1. JSON malforme -> 400
2. Payload trop volumineux -> 400
3. Ressource inexistante -> 404

## 5) Prerequis

1. Docker + Docker Compose
2. Node.js 22+ (si execution sans conteneur)
3. Un compte Docker Hub

## 6) Configuration environnement

1. Copier le template:

   cp .env.example .env

2. Variables importantes dans .env.example:

   NODE_ENV, PORT
   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   API_IMAGE, STATS_API_IMAGE

## 7) Execution locale (stack dev)

Stack complete avec build local source:

1. docker compose up -d --build
2. docker compose ps

Verifications minimales:

1. curl -i http://localhost:3000/health
2. curl -i http://localhost:8000/health
3. curl -i http://localhost:8000/stats

Arret:

1. docker compose down

## 8) Verification fonctionnelle CRUD (preuves)

1. Creer une tache:

   curl -i -X POST http://localhost:3000/api/tasks \
   -H "Content-Type: application/json" \
   -d '{"description":"teacher test","status":"todo"}'

2. Lister les taches:

   curl -i http://localhost:3000/api/tasks

3. Tester un status invalide (attendu 400):

   curl -i -X POST http://localhost:3000/api/tasks \
   -H "Content-Type: application/json" \
   -d '{"description":"bad","status":"invalid"}'

4. Verifier DB non exposee sur host:

   docker inspect -f '{{json .HostConfig.PortBindings}}' todo-postgres

Resultat attendu: null ou {}

## 9) Adminer (verification manuelle DB)

1. URL: http://localhost:8080
2. Server: todo-postgres
3. User: todo_user
4. Password: todo_pass
5. Database: todo_db

## 10) Publish Docker Hub + redeploy prod

### Images publiees

1. nguyenthivananh/todo-api:1.0.0
2. nguyenthivananh/todo-stats-api:1.0.0

### Build + push

1. docker build -t nguyenthivananh/todo-api:1.0.0 .
2. docker build -t nguyenthivananh/todo-stats-api:1.0.0 ./stats_api
3. docker login
4. docker push nguyenthivananh/todo-api:1.0.0
5. docker push nguyenthivananh/todo-stats-api:1.0.0

### Redeploy sans code source (compose prod)

1. Verifier .env contient:

   API_IMAGE=nguyenthivananh/todo-api:1.0.0
   STATS_API_IMAGE=nguyenthivananh/todo-stats-api:1.0.0

2. Lancer stack prod:

   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d

3. Verifier:

   curl --retry 20 --retry-all-errors --retry-delay 1 -i http://localhost:3000/health
   curl --retry 20 --retry-all-errors --retry-delay 1 -i http://localhost:8000/stats

4. Arret:

   docker compose -f docker-compose.prod.yml down

## 11) Mesures et optimisation (Chapitre 10)

Le detail complet des mesures est deplace dans le fichier racine [tableau de métriques.md](tableau%20de%20métriques.md).

Ce fichier contient:

1. Le tableau des metriques (taille image, layers, build cold/warm, startup)
2. Les commandes exactes de reproduction
3. La conclusion optimisation
4. Les limites d interpretation des mesures

## 12) Journal de bord (resume par etape)

Date reference: 2026-08-03

### Etape 1 - CRUD socle

1. Objectif: routes CRUD completes + /health
2. Resultat: endpoints operationnels avec codes HTTP coherents

### Etape 2 - Validation et erreurs

1. Objectif: robustesse inputs + erreurs JSON stables
2. Resultat: 400/404 propres, JSON malforme et payload trop gros geres

### Etape 3 - Dockerfile production

1. Objectif: image optimisee, non-root, healthcheck
2. Resultat: Dockerfile multi-stage Node fonctionnel

### Etape 4 - PostgreSQL + volume

1. Objectif: persistence reelle
2. Resultat: donnees conservees apres restart

### Etape 5 - Network isolation

1. Objectif: DB non exposee host
2. Resultat: DB joignable uniquement via network interne

### Etape 6 - Config externe

1. Objectif: aucune valeur hardcodee
2. Resultat: .env + validation fail-fast

### Etape 7 - Compose complet

1. Objectif: orchestration api + db + adminer
2. Resultat: stack demarre en une commande

### Etape 8 - Service Python stats

1. Objectif: agregation des statuts depuis la meme DB
2. Resultat: /stats renvoie les compteurs attendus

### Etape 9 - Registry et redeploy

1. Objectif: publier images + compose prod sans build local
2. Resultat: images poussees Docker Hub et pull valide via compose prod

### Etape 10 - Metrics

1. Objectif: preuves quantitatives
2. Resultat: tableau de mesures complet ajoute

## 13) Commandes utiles

1. npm run dev
2. npm start
3. npm test (actuellement aucun fichier de test versionne)
4. npx jest --passWithNoTests (verification CI locale sans echec)
5. docker compose up -d --build
6. docker compose -f docker-compose.prod.yml up -d

## 14) Nettoyage

1. docker compose down
2. docker compose -f docker-compose.prod.yml down
3. docker volume ls

## 15) Notes importantes

1. En prod compose, API_IMAGE et STATS_API_IMAGE sont obligatoires.
2. Si curl echoue juste apres up -d, relancer avec --retry (startup transitoire).
3. Une erreur Docker Hub insufficient_scope indique souvent un namespace username incorrect.
