# Procedure de deploiement et passation d astreinte - Phase 9

Derniere mise a jour: 2026-08-05

But: permettre a une personne qui ne connait pas le projet de deployer, verifier, depanner et rollback sans aide orale.

## 1. Contexte et perimetre

Ce document couvre:

1. Demarrage apres reboot machine.
2. Deploiement nominal via GitHub Actions.
3. Verification technique et metier post-deploiement.
4. Retour arriere vers un SHA precedent.
5. Passation incident avec mesure MTTR.

Ce document ne remplace pas l architecture globale (voir README). Il sert uniquement d execution operations.

## 2. Prerequis obligatoires

### 2.1 Acces et outillage

1. Docker actif sur la machine locale.
   - Test: `docker info`
2. Cle SSH de deploiement disponible localement.
   - Fichier attendu: `./deploy_key`
3. Runner GitHub self-hosted installe sous `~/actions-runner`.
4. Acces ecriture sur la branche `main` du repo GitHub.

### 2.2 Variables et secrets GitHub

Secrets requis:

1. `DOCKERHUB_USERNAME`
2. `DOCKERHUB_TOKEN`
3. `DEPLOY_SSH_KEY`
4. `DEPLOY_HOST`
5. `DEPLOY_PORT`
6. `DEPLOY_USER`
7. `DB_PASSWORD`

### 2.3 Configuration cible

Sur la cible, le fichier `/srv/todo/.env` doit exister et contenir:

1. `DB_USER`
2. `DB_PASSWORD`
3. `DB_NAME`
4. `GRAFANA_ADMIN_USER`
5. `GRAFANA_ADMIN_PASSWORD`

Emplacement des fichiers cibles (machine de deploiement):

1. `/srv/todo/compose.yml` - stack production (copiee par pipeline)
2. `/srv/todo/prometheus.yml` - config scrape Prometheus
3. `/srv/todo/grafana/provisioning/datasources/prometheus.yml` - datasource Grafana
4. `/srv/todo/grafana/provisioning/dashboards/dashboard.yml` - provider dashboards
5. `/srv/todo/grafana/dashboards/todo-api-golden-signals.json` - dashboard golden signals
6. `/srv/todo/.env` - secrets runtime (cree manuellement)

Ports publies:

1. `2222` - SSH vm-prod
2. `3000` - API
3. `9090` - Prometheus
4. `3001` - Grafana

## 3. Demarrage standard apres reboot machine

Executer exactement dans cet ordre:

```bash
# 1) Docker
docker info

# 2) Cible vm-prod
docker start vm-prod
docker ps --filter name=vm-prod

# 3) Runner self-hosted (laisser ouvert)
cd ~/actions-runner
./run.sh
```

Attendu:

1. `docker info` repond sans erreur.
2. `vm-prod` est `Up`.
3. Runner affiche `Listening for Jobs`.

Verification explicite stack cible (obligatoire):

1. Commande:
  - `ssh -i deploy_key -p 2222 root@localhost "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'"`
2. Attendu:
  - `todo-api`, `todo-db`, `prometheus`, `grafana` doivent tous etre `Up`.

Si le job GitHub reste sur `Waiting for a runner to pick up this job`, le runner est arrete ou deconnecte.

## 4. Baseline avant deploiement

Avant chaque push de deploiement:

```bash
curl -sS http://localhost:3000/health
curl -sS http://localhost:9090/-/healthy
curl -sS http://localhost:3001/api/health

ssh -i deploy_key -p 2222 root@localhost \
  "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

Attendu:

1. API renvoie `status: ok`.
2. Prometheus renvoie `Healthy`.
3. Grafana renvoie `database: ok`.
4. `todo-api`, `todo-db`, `prometheus`, `grafana` en `Up`.

## 5. Procedure de deploiement nominal

Duree attendue d un deploiement normal:

1. 2 a 4 minutes entre `git push` et fin de `deploy-vm-prod`.
2. Au-dela de 5 minutes, investiguer (runner, reseau, image pull, health checks).

### Etape 1 - Push sur main

```bash
git checkout main
git pull --rebase
git push origin main
```

Verification (observable):

1. `git rev-parse main` et `git rev-parse origin/main` doivent etre identiques.

### Etape 2 - Suivi pipeline

Ordre attendu des jobs:

1. `verify`
2. `build`
3. `build-and-push`
4. `self-hosted-smoke`
5. `deploy-vm-prod`

Verification (observable):

1. Aucun job ne reste bloque sur `Waiting for a runner to pick up this job`.
2. `build-and-push` se termine sans erreur de publication Docker Hub.

### Etape 3 - Verifier la version deployee

```bash
SHA=$(git rev-parse main)
echo "$SHA"

ssh -i deploy_key -p 2222 root@localhost \
  'docker inspect -f "{{.Config.Image}}" todo-api'
```

Attendu: image `todo-api` taggee avec le meme SHA que `main`.

Verification (observable):

1. Le SHA affiche dans l image est strictement celui du commit pousse.

## 6. Verification post-deploiement

Executer:

```bash
curl -sS http://localhost:3000/health
curl -sS http://localhost:3000/api/tasks
curl -sS http://localhost:3001/api/health
curl -sS 'http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22todo-api%22%7D'
```

Attendu:

1. `/health` en 200.
2. `/api/tasks` repond JSON valide.
3. Grafana `database: ok`.
4. Prometheus retourne `up{job="todo-api"}=1`.

## 7. Retour arriere (rollback)

### 7.1 Commande unique

```bash
ssh -i deploy_key -p 2222 root@localhost \
  "cd /srv/todo && TAG=<SHA_PRECEDENT> DOCKERHUB_USERNAME=<DOCKERHUB_USERNAME> docker compose -f compose.yml up -d"
```

Attendu:

1. La commande retourne sans erreur.
2. Le service `todo-api` est recree avec le tag cible.
3. Le trafic applicatif redevient stable en quelques secondes.

### 7.2 Verification rollback

```bash
curl -sS http://localhost:3000/health
curl -sS http://localhost:3000/api/tasks
ssh -i deploy_key -p 2222 root@localhost \
  'docker inspect -f "{{.Config.Image}}" todo-api'
```

### 7.3 Regles de decision

Rollback immediat si:

1. API indisponible plus de 2 minutes.
2. Taux 5xx eleve et continu apres deploiement.
3. Regression metier claire sur endpoint critique.

Qui prend la decision:

1. La personne d astreinte active decide le rollback immediat.
2. Toute action destructive hors rollback (suppression volume, reset DB) demande validation du responsable projet.

## 8. Pannes connues et remediations

1. Message: `Waiting for a runner to pick up this job`
   - Cause: runner non lance
   - Action: `cd ~/actions-runner && ./run.sh`
2. Message: `Connection reset by peer` pendant checks
   - Cause: startup transitoire
   - Action: re-run; workflow a retry + fallback scrape
3. Message: `Prometheus did not report up{job="todo-api"}=1 in time`
   - Action:
     - verifier `curl -sS http://localhost:9090/api/v1/targets`
    - verifier `ssh ... "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"`
4. Message: `manifest unknown`
   - Cause: SHA inexistant sur Docker Hub
   - Action: corriger SHA de rollback/deploy

Signature dashboard (diagnostic rapide):

1. API stoppee:
  - `up` -> 0
  - traffic -> chute forte
  - action: redemarrer `todo-api`
2. DB stoppee:
  - `up` peut rester 1
  - `5xx` augmente fortement
  - action: redemarrer `todo-db`
3. Regression applicative:
  - `up` reste 1
  - `5xx` augmente et endpoint metier casse
  - action: rollback SHA precedent
4. Pipeline ok mais prod non mise a jour:
  - `up` stable mais image inchangee
  - action: verifier runner self-hosted actif puis re-run deploy

## 9. Passation d astreinte (obligatoire phase 9)

Objectif: prouver que la procedure est utilisable par une autre personne.

Faire deux tours:

1. Tour A -> B: A injecte incident, B depanne.
2. Tour B -> A: B injecte incident, A depanne.

### Scenario incident 1: arret API

Injection:

```bash
ssh -i deploy_key -p 2222 root@localhost 'docker stop todo-api'
```

Attendu (pendant incident):

1. `curl -sS http://localhost:3000/health` echoue ou ne repond pas.
2. `up{job="todo-api"}` bascule a `0`.

Remediation:

```bash
ssh -i deploy_key -p 2222 root@localhost 'docker start todo-api'
```

Attendu (apres remediation):

1. `curl -sS http://localhost:3000/health` repond a nouveau.
2. `up{job="todo-api"}` revient a `1`.

### Scenario incident 2: arret DB

Injection:

```bash
ssh -i deploy_key -p 2222 root@localhost 'docker stop todo-db'
```

Attendu (pendant incident):

1. API peut rester joignable (`up` souvent a `1`).
2. Les routes metier montent en erreurs (`5xx`) sur les operations DB.

Remediation:

```bash
ssh -i deploy_key -p 2222 root@localhost 'docker start todo-db'
```

Attendu (apres remediation):

1. `curl -sS http://localhost:3000/api/tasks` repond en JSON normal.
2. Le taux d erreur revient proche de `0`.

Mesurer `MTTR = T_retour_OK - T_detection`.

## 10. Template journal de bord (preuve evaluable)

| Date | Operateur | Incident | T detection UTC | Action | T retour UTC | MTTR (s) | Validation |
|---|---|---|---|---|---|---:|---|
| A_COMPLETER | A | Stop todo-api | A_COMPLETER | docker start todo-api | A_COMPLETER | A_COMPLETER | OK/NOK |
| A_COMPLETER | B | Stop todo-db | A_COMPLETER | docker start todo-db | A_COMPLETER | A_COMPLETER | OK/NOK |

## 11. Rebuild complet vm-prod (si machine perdue)

```bash
cd /home/vanan/projects/todo-api

# Cle (si besoin)
ssh-keygen -t ed25519 -N "" -f deploy_key

# Rebuild vm
docker build -f Dockerfile.vm -t vm-prod .
docker run -d --privileged --name vm-prod \
  -p 2222:22 -p 3000:3000 -p 9090:9090 -p 3001:3001 \
  -v vm-prod-data:/var/lib/docker vm-prod

# Test SSH
ssh -i deploy_key -p 2222 root@localhost 'docker version --format "{{.Server.Version}}"'
```

Ensuite recreer `/srv/todo/.env` manuellement sur la cible et mettre a jour `DEPLOY_SSH_KEY` dans GitHub secrets si la cle a change.

## 12. Regles de rigueur (obligatoires)

1. Ne jamais versionner `deploy_key`, `.env`, credentials.
2. Ne jamais patcher a la main les fichiers versionnes sur la cible (`compose.yml`, `prometheus.yml`, dashboards).
3. Un objectif operationnel = un commit dedie.
4. Conserver les preuves minimales: commandes, resultat, timestamp.

## 13. Mise a l epreuve avant passation

Tester la procedure avant de la donner a un camarade:

1. Relecture froide ligne par ligne:
  - question: "un inconnu peut-il executer sans me demander ?"
  - corriger toute etape ambigue (chemin, port, nom de service).
2. Cas non prevu simule:
  - exemple: port 3000 deja occupe sur la cible.
  - verifier que la procedure fournit un diagnostic + sortie de crise.
3. Erreur volontaire dans une commande:
  - injecter une faute (SHA faux, service mal nomme) et verifier que le point de verification suivant detecte l erreur rapidement.

## 14. Apres publication image: quoi faire

Quand l image SHA existe deja sur Docker Hub, sequence immediate:

1. Verifier que `deploy-vm-prod` est bien passe vert.
2. Verifier version active sur cible (`docker inspect ... todo-api`).
3. Executer checks post-deploiement (API, metier, Prometheus, Grafana).
4. Si anomalie metier ou 5xx forts: rollback avec la commande section 7.
5. Renseigner Journal MTTR/observations dans la section 10.

## 15. Test reel execute (preuve a joindre au rapport)

Reference execution: 2026-08-05

### 15.1 Contexte de test

1. Branche: `main`
2. SHA attendu: `0d49c2340e938e2888886c43d18de6d390c68cac`
3. Cible: `vm-prod` local (SSH `root@localhost:2222`)

### 15.2 Resultat pipeline

Extrait runner self-hosted observe:

1. `2026-08-05 19:20:07Z: Job self-hosted-smoke completed with result: Succeeded`
2. `2026-08-05 19:22:57Z: Job deploy-vm-prod completed with result: Succeeded`

Conclusion: le deploiement automatise est passe vert de bout en bout.

### 15.3 Verification version deployee

Commandes executees:

```bash
git rev-parse main
git rev-parse origin/main
ssh -i deploy_key -p 2222 root@localhost 'docker inspect -f "{{.Config.Image}}" todo-api'
```

Observation:

1. `LOCAL_MAIN=0d49c2340e938e2888886c43d18de6d390c68cac`
2. `ORIGIN_MAIN=0d49c2340e938e2888886c43d18de6d390c68cac`
3. Image active: `nguyenthivananh/todo-api:0d49c2340e938e2888886c43d18de6d390c68cac`

Conclusion: image deployee conforme au commit pousse.

### 15.4 Checks post-deploiement (observables)

| Check | Commande | Resultat observe | Statut |
|---|---|---|---|
| API sante | `curl -sS http://localhost:3000/health` | `{"status":"ok",...}` | OK |
| API metier | `curl -sS http://localhost:3000/api/tasks` | `[]` (JSON valide) | OK |
| Prometheus sante | `curl -sS http://localhost:9090/-/healthy` | `Prometheus Server is Healthy.` | OK |
| Grafana sante | `curl -sS http://localhost:3001/api/health` | `database: ok` | OK |
| Scrape cible | `curl -sS 'http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22todo-api%22%7D'` | valeur `"1"` pour `job="todo-api"` | OK |

### 15.5 Snapshot golden signals releve

Timestamp: `2026-08-05T19:37:33Z`

1. `req_s=0.21636435757816158`
2. `err_5xx=0`
3. `p95_s=0.00475`

Interpretation:

1. Service disponible et stable.
2. Aucun signal d erreur active au moment du controle.
3. Latence p95 tres basse sur la fenetre observee.

### 15.6 Decision operationnelle

1. Aucun rollback necessaire.
2. Deploiement valide.
3. Donnees prêtes pour section Journal/Phase 9 du rapport.

