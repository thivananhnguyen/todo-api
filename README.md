# Todo API - README complet (Partie 1)

[![Verify](https://github.com/thivananhnguyen/todo-api/actions/workflows/verify.yml/badge.svg)](https://github.com/thivananhnguyen/todo-api/actions/workflows/verify.yml)
[![Release](https://github.com/thivananhnguyen/todo-api/actions/workflows/release.yml/badge.svg)](https://github.com/thivananhnguyen/todo-api/actions/workflows/release.yml)
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
8. Releve reel (3 moments) pour le journal:

| Moment | Timestamp (UTC) | up | Requetes/s | Taux d erreur 5xx | p95 (s) |
|---|---|---:|---:|---:|---:|
| Au repos, avant la boucle de charge | 2026-08-05T15:30:19Z | 1 | 6.201403375687464 | 0 | 0.02399875 |
| Pendant la boucle de charge | 2026-08-05T15:30:40Z | 1 | 5.300640043270531 | 0 | 0.0240859375 |
| Pendant l incident (todo-api stop 45s) | 2026-08-05T15:32:48Z | 0 | 0.025033333333333335 | 0 | N/A |

### Partie 3 - Phase 9 (Procedure deploiement et passation d astreinte)

1. Objectif:
   - Rendre le deploiement operable par une autre personne, sans connaissance implicite du projet.
   - Tester une vraie passation incident avec mesure MTTR.
2. Livrables attendus:
   - Un runbook de deploiement/rollback utilisable en copier-coller.
   - Deux exercices de passation (A depanne B, puis B depanne A).
   - Un journal avec timestamps, symptomes, diagnostic, action et MTTR.
3. Procedure individuelle recommandee (avant comparaison groupe):
   - Etape 1: deploy nominal depuis main et verifier /health, Prometheus, Grafana.
   - Etape 2: executer un incident volontaire (un seul a la fois), observer dashboard, corriger.
   - Etape 3: mesurer MTTR et noter ce qui manque dans la procedure.
   - Etape 4: corriger la procedure, puis rejouer le meme incident pour valider.
4. Incidents minimaux a couvrir en individuel:
   - Incident A: stop todo-api (availability doit tomber rapidement).
   - Incident B: stop todo-db (API peut rester up, erreurs metier doivent monter).
   - Incident C: image/tag invalide au redeploy (echec explicite, pas de demi-deploy silencieux).
5. Commandes de reference:
   - Deploy: cd /srv/todo && TAG=<sha> DOCKERHUB_USERNAME=<user> docker compose -f compose.yml up -d
   - Rollback: cd /srv/todo && TAG=<sha_precedent> DOCKERHUB_USERNAME=<user> docker compose -f compose.yml up -d
   - Health API: curl -sS http://localhost:3000/health
   - Health Prometheus: curl -sS http://localhost:9090/-/healthy
   - Health Grafana: curl -sS http://localhost:3001/api/health
6. Template Journal individuel (a remplir):

| Incident | Debut (UTC) | Detection (signal) | Action corrective | Retour OK (UTC) | MTTR (s) | Correctif runbook |
|---|---|---|---|---|---:|---|
| Stop todo-api | A_COMPLETER | up=0 | A_COMPLETER | A_COMPLETER | A_COMPLETER | A_COMPLETER |
| Stop todo-db | A_COMPLETER | 5xx en hausse | A_COMPLETER | A_COMPLETER | A_COMPLETER | A_COMPLETER |

7. Comparaison groupe (apres travail individuel):
   - Comparer MTTR entre membres pour le meme incident.
   - Identifier les etapes ambigues (commande, prerequis, verification).
   - Converger vers une seule version runbook avec wording plus clair.
   - Garder les preuves minimales: commande executee, capture symptome, capture retour normal.
8. Critere de validation Phase 9:
   - Une personne externe suit la procedure et restaure le service sans aide orale.
   - Les commandes de rollback sont testees pour de vrai.
   - Le journal contient au moins 2 passations avec MTTR explicite.
9. Document operationnel associe:
   - Voir docs/PROCEDURE_DEPLOIEMENT.md pour la procedure complete (deploy, verification, rollback, drill incident, template MTTR).

### Partie 3 - Phase 10 (Ce qui n a pas encore ete realise)

Dans le contexte d apprentissage a distance, la passation en binome n a pas encore ete jouee.
J ai pris l initiative de contacter mon camarade, mais sans retour a ce stade, donc la validation a ete faite en solo; des qu il repond, la passation en binome sera realisee et ajoutee aux preuves.

### Partie 4 - Jour 4 - Phase 1 (Serveur unique vers cluster)

Premiere bascule de la journee: sortir du modele VM unique et poser la base Kubernetes.

1. Ce qui a ete fait:
   - Creation du cluster local `todo-cluster` (k3d) avec entree `8080:80@loadbalancer`.
   - Initialisation des premiers manifestes dans `k8s/`:
     - `namespace.yaml`
     - `todo-api-deployment.yaml`
     - `todo-api-service.yaml`
2. Ce qui a ete verifie:
   - Node control-plane en etat Ready.
   - Namespace `todo` et objets API bien appliques.
   - Image SHA correctement tiree depuis Docker Hub.
3. Ce qu on observe logiquement a ce stade:
   - `todo-api` boucle avec `getaddrinfo EAI_AGAIN todo-db`, car la base n existe pas encore dans le cluster (traite en Phase 3).

### Partie 4 - Jour 4 - Phase 2 (ConfigMap + Secret, suppression du hardcode)

L enjeu ici etait clair: enlever le hardcode et rendre l image reutilisable sans rebuild.

1. Ce qui a ete fait:
   - `k8s/todo-api-deployment.yaml` bascule de `env` vers `envFrom`.
   - Ajout de `k8s/todo-config.yaml` (template `CHANGE_ME`).
   - Ajout de `k8s/todo-secret.yaml` avec `stringData` (template `CHANGE_ME`).
   - Creation des vraies valeurs au runtime via `kubectl create ... --dry-run=client -o yaml | kubectl apply -f -`.
2. Ce qui a ete verifie:
   - Le deployment lit bien `todo-config` et `todo-secret` (`Environment Variables from`).
   - Cas nominal: variables presentes dans le conteneur, sans hardcode dans Git.
   - Cas limite: modification ConfigMap visible seulement apres redemarrage du pod.
   - Cas cassant: suppression de `DB_PASSWORD` -> echec propre `Missing required environment variable: DB_PASSWORD`.
3. Point de vigilance conserve:
   - Tant que `todo-db` n existe pas encore, l API ne peut pas etre nominale.

### Partie 4 - Jour 4 - Phase 3 (PostgreSQL + PVC)

Cette phase valide le socle donnees: service DB stable et persistance reelle.

1. Ce qui a ete fait:
   - Ajout de `k8s/todo-db.yaml` (PVC + Deployment + Service).
   - Completion runtime des variables DB (`DB_NAME` dans Secret, `DB_HOST=todo-db` dans ConfigMap).
2. Ce qui a ete verifie (tests enseignant):
   - PVC `todo-db-data` en `Bound`.
   - Persistance confirmee: tache creee avant restart pod DB, puis relue apres recreation (`TASK_PERSISTED=YES`).
   - Comportement transitoire documente: `500 ECONNREFUSED` possible juste apres retour DB, puis retour a `200` apres retries.
   - Service casse/repare: selector `todo-db-broken` -> `HTTP 500`, restauration selector -> `HTTP 200`.
   - Protection PVC: suppression demandee pendant usage -> `Terminating` + finalizer `kubernetes.io/pvc-protection`.

### Partie 4 - Jour 4 - Phase 4 (Ingress - porte d entree)

On ajoute ensuite la porte d entree externe du cluster.

1. Ce qui a ete fait:
   - Ajout de `k8s/todo-ingress.yaml`.
   - Ingress `todo-ingress` avec `ingressClassName: traefik`, host `todo.localhost`, route `/` vers service `todo-api:80`.
2. Ce qui a ete verifie:
   - Nominal: `/health` via ingress -> `HTTP 200`.
   - Route volontairement cassee (`/api`) -> `HTTP 404`.
   - Port backend volontairement casse (`3000` au lieu de `80`) -> `HTTP 404`.
   - Restauration complete -> retour `HTTP 200`.

### Partie 4 - Jour 4 - Phase 5 (Pipeline deploy vers cluster)

Cette phase est le pivot du jour: le runner pousse toujours, mais la cible devient le cluster.

1. Ce qui a ete fait:
   - `release.yml` passe de `deploy-vm-prod` (SSH/compose) a `deploy-cluster` (kubectl).
   - Update image via `${github.sha}` puis gate strict avec `kubectl rollout status --timeout=180s`.
   - Verification post-deploy via `/health` sur ingress.
2. Point CI important:
   - `verify.yml` couvre deja les PR vers `main` via `on: pull_request`.
3. Scenarios validates:
   - Push `main` -> deploy effectif sur cluster.
   - Push branche -> verify/build sans deploy cluster.
   - Tag invalide -> rollout bloque et pipeline rouge (comportement attendu).
5. Preuve Scenario A (execute):
   - Commit pousse sur `main`: `b5e4a02d42572dfccdc6df58c16dfe3c66ba6928`.
   - Verification cluster: `kubectl describe deployment todo-api -n todo` affiche `Image: nguyenthivananh/todo-api:b5e4a02d42572dfccdc6df58c16dfe3c66ba6928`.
   - Conclusion: deploiement effectif via pipeline release sans commande manuelle de deploy.
6. Preuve Scenario B (execute):
   - Branche de test poussee: `ci-no-deploy`.
   - Commit de test branche: `f30d159537ff4768a421009660219bf7591836bd` (`test(ci): scenario B branch push no cluster deploy`).
   - Verification cluster apres push branche: `deployment.kubernetes.io/revision: 7` et `Image: nguyenthivananh/todo-api:b5e4a02d42572dfccdc6df58c16dfe3c66ba6928` (inchanges).
   - Conclusion: push sur branche lance la verification CI, sans deploiement cluster.
7. Preuve Scenario C (execute):
   - Commit de test main (tag invalide volontaire): `a8076f582390d77cbb242490d16f2ddd8e2c6cdd`.
   - Workflow release cible: run `31099791784`.
   - Effet observe sur cluster: `Image: nguyenthivananh/todo-api:a8076f582390d77cbb242490d16f2ddd8e2c6cdd-does-not-exist`, nouveau pod en `ErrImagePull`, revision deployment incrementee a `8`.
   - Conclusion: le rollout ne converge pas avec un tag inexistant, ce qui valide le garde-fou de la pipeline.
8. Restauration apres Scenario C:
   - Commit de restauration: `7196156` (retour du tag `${github.sha}` valide dans release.yml).
   - Un nouveau workflow release est relance pour revenir a un deploiement nominal.

### Partie 4 - Jour 4 - Phase 6 (Replicas x3 et preuve de repartition)

On a ensuite valide la logique "stateless = scale horizontal" sur l API.

1. Ce qui a ete fait:
   - `replicas` passe de 1 a 3 dans `k8s/todo-api-deployment.yaml`.
   - Ajout de `scripts/charge.sh` pour injecter du trafic via ingress.
2. Verification reelle (avant/apres charge):
   - Avant charge (`http_requests_total{method="GET",route="/api/tasks",status="200"}`):
     - `todo-api-785c69bb88-pfd6d`: `0`
     - `todo-api-785c69bb88-pfwd4`: `0`
     - `todo-api-785c69bb88-xk8zk`: `0`
   - Charge lancee: `./scripts/charge.sh 30` -> `Total : 237 requetes, 0 echouees`.
   - Apres charge:
     - `todo-api-785c69bb88-pfd6d`: `79`
     - `todo-api-785c69bb88-pfwd4`: `79`
     - `todo-api-785c69bb88-xk8zk`: `79`
   - Conclusion: trafic distribue sur les 3 pods (pas de pod unique).
3. Test inverse (selector service casse):
   - Selector `todo-api` force volontairement sur une etiquette inexistante.
   - Charge 8s: `Total : 74 requetes, 73 echouees` (majorite `HTTP 503`).
   - Restauration du selector `app=todo-api`, puis retour `HTTP 200` sur `/health`.

### Partie 4 - Jour 4 - Phase 7 (Readiness/Liveness et limite de /health)

Ici, le focus etait la sante applicative et ses limites.

1. Ce qui a ete fait:
   - Ajout de `readinessProbe` et `livenessProbe` sur `/health` (port `3000`) avec delais distincts.
2. Verification nominale (base disponible):
   - Rollout OK: `kubectl rollout status deployment/todo-api -n todo`.
   - Pods API en `READY 1/1`.
   - `curl -H "Host: todo.localhost" http://localhost:8080/health` -> `HTTP 200`.
   - `kubectl describe pod` affiche les deux sondes, sans evenement `Unhealthy` en nominal.
3. Test limite metier (base coupee, API intacte):
   - `kubectl scale deployment/todo-db -n todo --replicas=0`.
   - Observation:
     - `/health` reste `HTTP 200`.
     - `/api/tasks` renvoie `HTTP 500` avec `connect ECONNREFUSED ...:5432`.
     - Pods API restent `READY 1/1`.
   - Conclusion: les sondes prouvent ici que le serveur HTTP repond, pas que la dependance DB est disponible.
4. Test erreur de configuration readiness (port 3001 volontairement faux):
   - Readiness temporairement pointee sur `3001`.
   - `kubectl describe pod` montre `Readiness probe failed ... connect: connection refused`.
   - Quand seuls les pods mal configures restent (scale `todo-api` a `0` puis `1` pendant ce test):
     - pod API en `READY 0/1`.
     - endpoint `todo-api` uniquement en `notReadyAddresses`.
     - `curl /health` via ingress -> `HTTP 503` (`no available server`).
5. Restauration:
   - Readiness remise sur `3000`.
   - `todo-db` remis a `1` replica.
   - `todo-api` remis a `3` replicas.
   - Verification finale: `/health` `HTTP 200` et `/api/tasks` `HTTP 200`.

### Partie 4 - Jour 4 - Phase 8 (Rolling update sous charge, mesure)

Phase de mesure pure: verifier qu un rolling update est vraiment sans perte sous charge.

1. Ce qui a ete fixe:
   - Strategie explicite: `maxUnavailable: 0`, `maxSurge: 1`.
2. Protocole execute:
   - Charge `./scripts/charge.sh 30` en parallele d un `kubectl set image`.
   - Convergence mesuree via `kubectl rollout status`.
3. Tableau demande par le cours (rempli):

| Deploiement | Requetes echouees | Secondes d indisponibilite | Temps de convergence totale |
| :---- | :----: | :----: | :----: |
| Hier, SSH manuel | 1 (drill ponctuel, pas de charge continue) | 43 s (rollback mesure en Phase 5) | N/A (pas de `rollout status` en mode compose/SSH) |
| Aujourd hui, rolling update | 0 | 0.0 s | 8 s |

4. Preuves de test (jour 4):
   - Run A (update vers `7b4e2d72...`): `Total 241`, `0 echouees`, convergence `8 s`.
   - Run B (update retour vers `b5e4a02d...`): `Total 242`, `0 echouees`, resultat similaire sur un deuxieme passage.
5. Lecture resultat:
   - Avec `maxUnavailable: 0`, le Service garde des pods prets pendant le remplacement.
   - Les deux executions consecutives confirment un resultat stable (0 requete echouee).

### Partie 4 - Jour 4 - Phase 9 (Rollback chronometre)

Derniere etape avant le chaos: chronometrer un vrai retour arriere Kubernetes.

1. Drill execute (cluster):
   - Scenario volontairement sensible (`replicas: 1`, `maxSurge: 0`, `maxUnavailable: 1`) pour rendre la panne visible.
   - Injection d une image invalide (`this-tag-does-not-exist-phase9`).
   - T0 au premier echec observable (`HTTP 503` sur `/health`).
   - Remediation via `kubectl rollout undo` + attente de convergence.
   - T1 au premier retour `HTTP 200` sur `/health`.
3. Mesure reelle:
   - T0: `2026-08-06T13:25:58Z`
   - T1: `2026-08-06T13:26:10Z`
   - MTTR mesure: `12 secondes`
4. Comparaison avec hier (Phase 5, SSH manuel):
   - Hier: `43 secondes`
   - Aujourd hui (cluster + rollback Kubernetes): `12 secondes`
   - Ecart: `-31 secondes` (retablissement plus rapide aujourd hui).
5. Verification `history` et `--to-revision=N`:
   - `kubectl rollout history deployment/todo-api -n todo` liste plusieurs revisions (`... 17, 18, 19, 20`).
   - `kubectl rollout undo --to-revision=<N>` fonctionne sur une revision explicite (teste avec une revision historique existante).
   - Observation utile: une revision ancienne peut reintroduire une config non desirable (test `--to-revision=4` -> `HTTP 503`), donc il faut cibler une revision connue saine.
6. Verification du cas sans historique:
   - Deployment de test `phase9-nohistory` cree puis `kubectl rollout undo` execute immediatement.
   - Resultat observe: `error: no rollout history found for deployment "phase9-nohistory"`.
7. Restauration finale:
   - Re-application du manifeste source `k8s/todo-api-deployment.yaml`.
   - Etat final confirme: `replicas=3`, `maxSurge=1`, `maxUnavailable=0`, `/health=200`, `/api/tasks=200`.

### Partie 4 - Jour 4 - Phase 10 (5 pannes, diagnostic et remede)

Cette phase a ete faite en mode diagnostic pur: on declenche une panne, on observe ce que racontent `kubectl get pods`, `kubectl describe pod` et les events, puis on corrige seulement si le cluster ne peut pas se reparer seul.

Le but n etait pas la surprise, mais la lecture des symptomes. Chaque panne a ete jouee puis restauree pour garder le cluster utilisable entre deux tests.

Tableau de diagnostic (rempli):

| Panne | Signature dans kubectl get pods | Signature dans kubectl describe / events | Se repare seule ? | Remede |
| :---- | :---- | :---- | :----: | :---- |
| Pod supprime | un pod `todo-api-...` disparait puis un nouveau pod apparait, retour a `3/3 Running` | events `SuccessfulDelete` puis `SuccessfulCreate` sur un nouveau pod | Oui | Aucun remede manuel (reconciliation Deployment) |
| Processus tue dans le conteneur | sur cette image, pas de bascule visible durable (`READY` reste `1/1` pendant le test) | test `kubectl exec ... kill 1`/`pkill node` execute; en theorie, kubelet doit redemarrer le conteneur | Oui (attendu) | Aucun remede manuel; verifier `RESTARTS` et events kubelet si la panne se reproduit |
| Tag d image inexistant | nouveau pod en `ErrImagePull` / `ImagePullBackOff` | events `Failed to pull image ... not found`, `ErrImagePull`, `ImagePullBackOff` | Non | Remettre une image valide (`kubectl set image ... <tag_valide>`) puis attendre `rollout status` |
| Cle du Secret supprimee | nouveau pod en `CrashLoopBackOff` apres restart | pod ne demarre plus avec secret incomplet (Secret reference present, demarrage impossible) | Non | Restaurer la cle supprimee dans `todo-secret`, puis relancer le rollout/restart |
| Limite memoire trop basse | pod en `CrashLoopBackOff` avec anciens pods encore `Running` tant que rollout bloque | `Last State: OOMKilled`, event `Back-off restarting failed container` | Non | Supprimer/augmenter `resources.limits.memory`, reappliquer le deployment, attendre convergence |

Lecture finale:
1. Le message de la phase est confirme: Kubernetes repare vite ce qui releve de la reconciliation (pod supprime), mais ne corrige pas une mauvaise configuration (image/secret/ressources).
2. Le cas "processus tue" est bien declenche, mais sur ce run la signature de restart n a pas ete aussi nette que prevu; il faut donc regarder `RESTARTS` avec un `watch` si on veut une preuve plus visible en direct.
3. En sortie de test, le service a ete remis proprement: `/health=200`, `/api/tasks=200`, `todo-api` revenu a `3 replicas`.

### Partie 4 - Jour 4 - Phase 11 (Procedure, version cluster)

Cette phase a consiste a remplacer la logique "VM + compose" par une procedure exploitable en mode cluster, sans changer de fichier.

1. Livrable mis a jour:
   - `docs/PROCEDURE_DEPLOIEMENT.md` conserve le meme nom, mais passe en mode Kubernetes (`todo-cluster`, namespace `todo`).
2. Ce qui a ete integre dans la procedure:
   - Prerequis d acces (`kubectl`, contexte, namespace) + baseline de verification.
   - Deploiement nominal via pipeline avec gate `kubectl rollout status`.
   - Deploiement manuel d urgence (si pipeline HS) avec controles apres chaque etape.
   - Rollback Kubernetes (`rollout undo`, `--to-revision`) et criteres de declenchement.
   - Tableau des 5 pannes de la phase 10 avec signatures/remedes.
   - Limite operationnelle de la phase 7: `/health` ne garantit pas la disponibilite DB.
3. Critere de sortie:
   - Procedure lisible sans aide orale, testable commande par commande, et alignee avec l etat reel du cluster.

### Partie 4 - Jour 4 - Phase 12 (Ajustement resources requests/limits)

Objectif de la phase: trouver une enveloppe memoire CPU plus serre que la config par defaut, sans perdre la disponibilite pendant charge + rolling update.

Demarche suivie:
1. Baseline mesuree avec `kubectl top pods` puis reduction progressive de `limits.memory`.
2. Validation de la frontiere en charge (`./scripts/charge.sh`) avec observation des pods (`kubectl get pods`, `describe`, events).
3. Important: correction de la methode quand une combinaison invalide a ete detectee (`requests.memory` ne peut pas etre > `limits.memory`).
4. Choix final = premier palier stable avant OOM recurrent.

Synthese des essais memoire:

| Regle testee | Observation principale | Decision |
| :---- | :---- | :---- |
| limit >= 24Mi (avec charge) | stable sur runs courts | trop conservateur |
| 22Mi | run mixte, traces de `Last State: OOMKilled` observees | zone limite |
| 20Mi | charge terminee sans erreur, pas de restart sur validation finale | retenu |
| 18Mi et dessous | instabilite/OOM selon runs | rejete |

Configuration finale appliquee dans le deployment `todo-api`:
- `requests.cpu: 50m`
- `requests.memory: 16Mi`
- `limits.cpu: 250m`
- `limits.memory: 20Mi`

Preuve de validation finale (cluster convergent):
1. `kubectl rollout restart deployment/todo-api -n todo` lance sous charge concurrente `./scripts/charge.sh 30`.
2. `kubectl rollout status` termine en succes en `25s`.
3. Charge finale: `239 requetes, 0 echouees`.
4. Verification fonctionnelle apres convergence: `/health=200` et `/api/tasks=200` via ingress `todo.localhost`.
5. Verification de la spec active: `requests.cpu=50m requests.memory=16Mi limits.cpu=250m limits.memory=20Mi`.

Conclusion Phase 12:
Le service garde le comportement attendu pendant un rolling update sous charge avec une enveloppe memoire significativement reduite. Le palier `20Mi` est le compromis retenu: plus agressif provoquait des signaux OOM non acceptables, plus large n apportait pas de benefice pedagogique pour cette phase.

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
