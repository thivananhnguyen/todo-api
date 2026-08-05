# Todo API - README complet (Partie 1)

[![CI](https://github.com/thivananhnguyen/todo-api/actions/workflows/ci.yml/badge.svg)](https://github.com/thivananhnguyen/todo-api/actions/workflows/ci.yml)
[![Docker Hub API](https://img.shields.io/badge/docker%20hub-nguyenthivananh%2Ftodo--api-blue)](https://hub.docker.com/r/nguyenthivananh/todo-api)
[![Docker Hub Stats](https://img.shields.io/badge/docker%20hub-nguyenthivananh%2Ftodo--stats--api-blue)](https://hub.docker.com/r/nguyenthivananh/todo-stats-api)

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

### Partie 3 - Phase 1 (Pipeline sur Todo API)

1. Objectif:
   - Demenager la CI sur le vrai repo Todo API.
   - Lancer verification sur branches et publication image seulement sur main.
2. Fichiers:
   - .github/workflows/ci.yml
3. Commandes et actions:
   - Ajout workflow avec job verify.
   - Ajout job build-and-push avec condition main.
   - Push de validation sur main et sur branche de travail.
4. Resultats observes:
   - Sur branche: verify execute, build-and-push non publie.
   - Sur main: image publiee avec tag commit sha.
5. Incident rencontre:
   - Ambiguite initiale sur test sans fichiers de test versionnes.
6. Correction appliquee:
   - Ajout d une vraie suite de tests dans tests/unit.
   - Renommage du job test en verify pour branch protection.
7. Preuves:
   - Workflow vert sur Actions.
   - Tags Docker Hub distincts sur push successifs.

### Partie 3 - Phase 2 (Machine cible maquette)

1. Objectif:
   - Provisionner une machine cible isolee avec Docker + SSH.
2. Fichiers:
   - Dockerfile.vm
   - .gitignore (exclusion deploy_key et deploy_key.pub)
3. Commandes et actions:
   - ssh-keygen -t ed25519 -N "" -f deploy_key
   - docker build -f Dockerfile.vm -t vm-prod .
   - docker run -d --privileged --name vm-prod -p 2222:22 -p 3000:3000 -p 9090:9090 -p 3001:3001 -v vm-prod-data:/var/lib/docker vm-prod
   - ssh -i deploy_key -p 2222 root@localhost
4. Resultats observes:
   - Connexion SSH avec cle reussie.
   - Connexion sans -i deploy_key refusee.
   - docker run --rm hello-world fonctionne dans la machine cible.
   - Apres docker restart vm-prod, les images restent presentes (volume persistant).
5. Incident rencontre:
   - Echec temporaire pull docker:28-dind (EOF reseau) lors d une tentative.
6. Correction appliquee:
   - Re-pull de l image puis reconstruction vm-prod.
7. Preuves:
   - vm-prod expose correctement 2222, 3000, 9090, 3001.
   - Isolation validee: docker ps dans vm-prod n affiche pas les conteneurs de dev host.

### Partie 3 - Phase 3 (Preparation self-hosted runner)

1. Objectif:
   - Preparer l execution future du job deploy depuis un runner local.
2. Actions realisees:
   - Verification des prerequis runner et des secrets deploy a configurer.
   - Alignement de la CI avec un check verify exploitable pour protected main.
3. Etat:
   - Runner local pret a etre enregistre sur GitHub Settings > Actions > Runners.
4. Secrets a fournir:
   - DEPLOY_SSH_KEY
   - DEPLOY_HOST
   - DEPLOY_PORT
   - DEPLOY_USER
5. Note process:
   - Le deploiement self-hosted n est pas active tant que le runner n est pas online.
6. Preuves demandees (test 2 puis retour config pass):
   - 377aace: ci(test2): run smoke job on ubuntu-latest for hosted runner proof
   - 9193ddd: ci(phase3): restore self-hosted smoke with vm-prod localhost check

### Partie 3 - Phase 4 (Job de deploiement automatise)

1. Objectif:
   - Deployer automatiquement sur la machine cible uniquement depuis main.
   - Garder la cle privee en memoire (jamais ecrite sur disque du runner).
2. Fichiers:
   - .github/workflows/ci.yml
   - deploy/compose.yml
3. Commandes et actions:
   - Ajout d un job build (sans push) pour verifier les branches de travail.
   - Build-and-push de todo-api et todo-stats-api avec tag commit SHA sur main.
   - Job deploy-vm-prod en self-hosted: ssh-agent, scp du compose vers /srv/todo, puis deploy avec TAG=${github.sha}.
   - Verification cible avant deploy: presence de /srv/todo/.env et des variables DB_USER, DB_PASSWORD, DB_NAME.
   - Verification post-deploiement via /health depuis la machine cible (fallback curl puis wget BusyBox).
4. Securite appliquee:
   - Utilisation de webfactory/ssh-agent avec DEPLOY_SSH_KEY (cle non ecrite en fichier temporaire).
   - Aucun echo de la cle privee dans les logs.
5. Resultats valides (3 scenarios):
   - Push main: chaine complete verify -> build -> build-and-push -> smoke -> deploy.
   - Push branche: verify + build uniquement, pas de deploy.
   - Secret volontairement faux: echec clair a la connexion SSH, sans fuite de cle.
6. Incidents rencontres et corrections:
   - Erreur interpolation DB_NAME absente: ajout du controle explicite de /srv/todo/.env avant le deploy.
   - Cible sans curl: ajout fallback wget.
   - BusyBox wget sans option --waitretry: remplacement par une boucle retry portable.
7. Preuves (commits):
   - a53d5e2: ci(phase4): build and push api plus stats-api images
   - 1f4b05a: ci(phase4): add self-hosted deploy job to vm-prod
   - ccba03f: ci(phase4): secure ssh-agent deploy to /srv/todo with TAG
   - 743d2b2: ci(phase4): health check fallback to wget when curl is missing
   - 1ea55d5: ci(phase4): make health check compatible with BusyBox wget
8. Etat de sortie pour Phase 5:
   - Pipeline de deploiement automatise stabilisee sur main.
   - Preconditions cibles formalisees (/srv/todo/.env controle).
   - Verification de sante robuste sur environnements cibles heterogenes.

### Partie 3 - Phase 5 (Rejouer et revenir en arriere)

1. Objectif:
   - Verifier qu un deploiement est idempotent (rejouable sans casser la prod).
   - Mesurer un rollback reel vers un commit precedent tague sur Docker Hub.
2. Principe cle:
   - Le deploiement utilise docker compose up -d, donc seul l etat different est applique.
   - Le rollback ne reconstruit rien: il suffit de changer TAG vers un sha precedent.
3. Commande de rollback de reference (a conserver):
   - cd /srv/todo && TAG=<sha_precedent> DOCKERHUB_USERNAME=<votre_user> docker compose -f compose.yml up -d
4. Scenario A - Rejouer le meme deploiement:
   - Push main une premiere fois et noter le sha deploye.
   - Push a nouveau sans changement fonctionnel (ou relancer le job) et verifier:
     - pas d erreur de port deja utilise,
     - pas de conteneur orphelin,
     - service toujours disponible (/health = 200).
5. Scenario B - Regression volontaire puis rollback:
   - Introduire une regression visible (ex: route /health retourne 500), commit/push main.
   - Constater la regression en production et noter l heure T0.
   - Rollback immediat vers le sha precedent valide avec la commande de reference.
   - Verifier le retablissement (/health = 200) et noter l heure T1.
   - Mesure attendue: delai rollback = T1 - T0.
6. Scenario C - Rollback vers un tag inexistant:
   - Lancer TAG=<sha_inexistant> ... docker compose up -d.
   - Attendu: echec lisible (manifest unknown / pull access denied), sans extinction partielle silencieuse.
7. Preuves a conserver (Actions + Journal):
   - Run main #1 (deploiement nominal).
   - Run main #2 (rejeu idempotent).
   - Capture regression constatee, puis capture service retabli apres rollback.
   - Log d echec clair sur tag inexistant.
8. Journal de bord (a remplir au fil de l eau):
   - SHA deploye nominal:
   - SHA rollback cible:
   - Heure constat regression (T0):
   - Heure service retabli (T1):
   - Delai rollback (T1 - T0):
   - Resultat scenario tag inexistant:
9. Execution reelle effectuee (2026-08-05):
   - Scenario A: teste en direct sur vm-prod avec TAG=1ea55d58c9b6ac4c6d3baa265c68771f687a9e42, 2 executions consecutives de docker compose up -d.
   - Resultat A: pas d erreur de port, conteneurs todo-api et todo-db restent Running/healthy, /health repond status=ok.
   - Scenario B: regression volontaire deployee via commit d6549c9, puis rollback vers 1ea55d58c9b6ac4c6d3baa265c68771f687a9e42.
   - Constat regression: GET /api/tasks retourne HTTP 500 (T0=2026-08-05T13:41:41Z).
   - Retablissement: apres rollback, /health=200 et GET /api/tasks retourne [] (T1=2026-08-05T13:42:24Z).
   - Delai rollback mesure: 43 secondes (T1 - T0).
   - Nettoyage repo apres drill: revert du commit regression avec aa9d782.
   - Scenario C: teste avec TAG inexistant (does-not-exist-1785936766).
   - Resultat C: echec explicite manifest unknown, code retour non nul, production existante reste active.

### Partie 3 - Phase 6 (Tests qui touchent la base dans la pipeline)

1. Objectif:
   - Ajouter des tests d integration qui parlent vraiment a PostgreSQL.
   - Faire echouer la pipeline avant deploy en cas de regression metier.
2. Fichiers:
   - tests/integration/tasks.integration.test.js
   - .github/workflows/ci.yml
   - package.json
3. Couverture fonctionnelle (4 comportements):
   - Creation d une tache puis relecture par id avec contenu attendu.
   - Lecture d un id inexistant avec 404 propre.
   - Requete invalide (champ manquant, description trop longue) avec 400.
   - Suppression d une tache puis verification qu elle disparait de la liste.
4. Fiabilite des tests:
   - Schema cree avant tests via initializeTaskTable (beforeAll).
   - Nettoyage DB avant chaque test via TRUNCATE TABLE tasks (beforeEach).
   - Job verify execute sur ubuntu-latest avec service postgres:16-alpine + healthcheck pg_isready.
5. Configuration CI retenue:
   - DB_HOST=localhost, DB_PORT=5432, DB_USER=todo_user, DB_NAME=todo_test en clair.
   - DB_PASSWORD via secret GitHub (secrets.DB_PASSWORD).
6. Verification reelle effectuee (2026-08-05):
   - npm test: 11/11 tests unitaires passes.
   - npm run test:integration: 4/4 tests passes contre un Postgres reel.
   - Deux executions consecutives de test:integration: 4/4 puis 4/4 (pas de pollution de donnees).
7. Checklist de verification a rejouer:
   - Push sur branche: verify doit lancer unit + integration et rester vert.
   - Casser volontairement une route (ex: mauvais code HTTP attendu): verify doit devenir rouge.
   - Corriger la route: verify repasse vert.

### Partie 3 - Phase 7 (Rendre l API mesurable)

1. Objectif:
   - Exposer des metriques Prometheus pour observer trafic, erreurs et latence.
   - Ajouter une metrique metier utile (taches creees) pour le suivi fonctionnel.
2. Fichiers:
   - src/observability/metrics.js
   - src/app.js
   - src/controllers/tasksController.js
   - tests/unit/app.api.test.js
3. Metriques implementees:
   - Route /metrics en texte brut (Content-Type Prometheus).
   - Counter http_requests_total{method,route,status}.
   - Histogram http_request_duration_seconds{method,route,status}.
   - Counter metier tasks_created_total.
4. Choix techniques importants:
   - Les routes inconnues 404 sont comptees avec le label route="unmatched".
   - Les labels de route utilisent le pattern Express (/api/tasks/:id) et jamais les ids reels.
   - Le compteur metier est incremente uniquement apres une creation de tache reussie.
5. Verification reelle effectuee (2026-08-05):
   - npm test: 15/15 tests unitaires passes (incluant les tests metrics).
   - npm run test:integration: 4/4 tests passes contre PostgreSQL reel.
   - Test compteur: trois appels GET /api/tasks incrementent exactement le compteur de +3.
6. Incidents reels rencontres et correction:
   - Conflit de port 3000: vm-prod occupait deja 0.0.0.0:3000, donc le service api local ne pouvait pas demarrer via compose.
   - Symptome observe: /health repondait mais /metrics retournait "Cannot GET /metrics" car les requetes partaient vers une autre instance (vm-prod).
   - Correction appliquee: demarrer la stack locale avec un port hote different (API_PORT=3100) pour isoler les tests metrics.
   - Commande retenue: API_PORT=3100 docker compose up -d --build api db stats-api
   - Verification retenue: utiliser ensuite http://localhost:3100/health et http://localhost:3100/metrics.
7. Checklist de verification manuelle:
   - Appeler 3 fois la meme route (ex: GET /api/tasks), puis lire /metrics et verifier +3.
   - Appeler une route inconnue et verifier un point http_requests_total avec status="404".
   - Verifier que /metrics contient # HELP et # TYPE pour counter/histogram.
   - Verifier qu aucun label ne contient un id dynamique de tache.

### Partie 3 - Phase 8 (Prometheus et Grafana sur la machine cible)

1. Objectif:
   - Ajouter la supervision dans la meme stack de production sur la machine cible.
   - Versionner la configuration Prometheus et le dashboard Grafana dans le depot.
2. Fichiers:
   - deploy/compose.yml
   - deploy/prometheus.yml
   - deploy/grafana/provisioning/datasources/prometheus.yml
   - deploy/grafana/provisioning/dashboards/dashboard.yml
   - deploy/grafana/dashboards/todo-api-golden-signals.json
   - .github/workflows/ci.yml
3. Services ajoutes dans la stack cible:
   - prometheus (prom/prometheus), port 9090 publie.
   - grafana (grafana/grafana), port 3001 publie.
   - Prometheus scrape todo-api via son nom de service interne: todo-api:3000.
4. Golden signals dans le dashboard:
   - Availability: up{job="todo-api"}
   - Traffic: sum(rate(http_requests_total[1m]))
   - Errors: ratio 5xx / total
   - Latency: p95 via histogram_quantile sur http_request_duration_seconds_bucket
5. Pipeline et deploiement:
   - Les fichiers prometheus/grafana sont copies depuis le depot vers /srv/todo a chaque deploy.
   - Aucune modification manuelle directe sur la machine de production.
   - Verification post-deploy etendue: API /health, Prometheus /-/healthy, Grafana /api/health.
   - Le fichier /srv/todo/.env doit contenir aussi GRAFANA_ADMIN_USER et GRAFANA_ADMIN_PASSWORD.
6. Verification manuelle recommandee:
   - Ouvrir Grafana: http://localhost:3001 (identifiants definis dans /srv/todo/.env).
   - Verifier datasource Prometheus preprovisionnee sur http://prometheus:9090 (pas localhost:9090 dans Grafana).
   - Lancer une boucle de charge pendant 2 minutes, puis observer les 4 panneaux.
7. Incidents a distinguer:
   - docker stop todo-api: up tombe rapidement a 0.
   - Base coupee mais API vivante: up peut rester a 1, mais le taux d erreur monte.

## 13) Commandes utiles

1. npm run dev
2. npm start
3. npm test
4. npm test -- --runInBand
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
