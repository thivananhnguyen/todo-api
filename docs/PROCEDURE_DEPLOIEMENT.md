# Procedure de deploiement cluster - Phase 11

Derniere mise a jour: 2026-08-06

But: permettre un deploiement, un rollback et un diagnostic incident sur `todo-cluster` sans connaissance implicite.

## 1. Perimetre

Cette procedure couvre:

1. Prerequis d acces cluster (contexte + namespace).
2. Deploiement nominal via pipeline release.
3. Deploiement manuel d urgence si la pipeline est indisponible.
4. Retour arriere Kubernetes (`rollout undo`).
5. Tableau des 5 pannes connues (phase 10) et remedes.

Important:

1. Ce document met a jour l ancien mode VM/compose.
2. Aucun fichier `PROCEDURE_K8S.md` separe ne doit etre cree.

## 2. Prerequis obligatoires

### 2.1 Acces local

1. `kubectl` installe.
2. Contexte pointe sur le cluster de travail.
3. Namespace de travail: `todo`.

Verification immediate:

```bash
kubectl config current-context
kubectl get nodes
kubectl get ns todo
kubectl get deploy,po,svc,ing -n todo
```

Attendu:

1. Le contexte cible bien `todo-cluster`.
2. Le namespace `todo` existe.
3. `todo-api` et `todo-db` sont visibles.

Si le contexte est faux:

```bash
kubectl config get-contexts
kubectl config use-context k3d-todo-cluster
kubectl config current-context
```

Si `k3d-todo-cluster` n apparait pas dans la liste:

1. Importer le kubeconfig du poste qui heberge le cluster.
2. Ne pas continuer la procedure tant que `kubectl config current-context` ne renvoie pas le bon contexte.

Optionnel (recommande pour eviter les erreurs de namespace):

```bash
kubectl config set-context --current --namespace=todo
```

Note:

1. Cette option permet d eviter d oublier `-n todo` dans les commandes quotidiennes.

### 2.2 Runner et CI

1. Le runner self-hosted doit etre online pour les jobs qui en dependent.
2. Les secrets GitHub Docker Hub doivent rester valides (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).

## 3. Baseline avant toute action

Executer:

```bash
kubectl get deploy,po -n todo
curl -sS -H "Host: todo.localhost" http://localhost:8080/health
curl -sS -H "Host: todo.localhost" http://localhost:8080/api/tasks
```

Attendu:

1. `todo-api` en `READY` nominal.
2. `/health` repond `200`.
3. `/api/tasks` repond en JSON.

## 4. Deploiement nominal (pipeline)

### Etape 1 - Push main

```bash
git checkout main
git pull --rebase
git push origin main
```

### Etape 2 - Validation Actions

Voir l onglet Actions du repository GitHub pour suivre l execution.

Ordre logique attendu:

1. `verify`
2. `build`
3. `build-and-push`
4. `deploy-cluster`

Point de controle critique:

1. Le job de deploy doit gate sur `kubectl rollout status`.
2. Si le rollout ne converge pas, le job doit echouer en rouge (pas de faux positif).

### Etape 3 - Verification post-deploy

```bash
SHA=$(git rev-parse main)
kubectl get deploy -n todo todo-api -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
kubectl rollout status deployment/todo-api -n todo --timeout=180s
curl -sS -H "Host: todo.localhost" http://localhost:8080/health
```

Attendu:

1. L image du deployment contient le SHA deploye.
2. Le rollout converge.
3. `/health` revient `200`.

## 5. Deploiement manuel d urgence (pipeline indisponible)

Utiliser seulement si la pipeline release est HS.

### Etape 1 - Identifier le SHA/tag cible

```bash
TARGET_SHA=<sha_valide_present_sur_docker_hub>
echo "$TARGET_SHA"
```

### Etape 2 - Changer l image

```bash
kubectl set image deployment/todo-api -n todo todo-api="nguyenthivananh/todo-api:${TARGET_SHA}"
```

Verification immediate:

```bash
kubectl get deploy -n todo todo-api -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

### Etape 3 - Gate de convergence

```bash
kubectl rollout status deployment/todo-api -n todo --timeout=180s
```

### Etape 4 - Verification fonctionnelle

```bash
curl -sS -H "Host: todo.localhost" http://localhost:8080/health
curl -sS -H "Host: todo.localhost" http://localhost:8080/api/tasks
```

Attendu:

1. `/health` en 200.
2. `/api/tasks` en 200 JSON.

## 6. Retour arriere (rollback Kubernetes)

Commande standard:

```bash
kubectl rollout undo deployment/todo-api -n todo
kubectl rollout status deployment/todo-api -n todo --timeout=180s
```

Rollback cible (revision explicite):

```bash
kubectl rollout history deployment/todo-api -n todo
kubectl rollout undo deployment/todo-api -n todo --to-revision=<N>
kubectl rollout status deployment/todo-api -n todo --timeout=180s
```

Criteres de declenchement rollback:

1. `kubectl rollout status` echoue ou depasse `180s`.
2. Presence de `ErrImagePull`, `ImagePullBackOff`, `CrashLoopBackOff` ou `ProgressDeadlineExceeded` sur le nouveau rollout.
3. `/health` n obtient pas `200` apres 3 tentatives espacees de 10s.
4. `/api/tasks` renvoie `500` en continu pendant au moins 60s apres la fin theorique du rollout.

Commande de verification rapide avant decision:

```bash
kubectl get po -n todo -l app=todo-api
kubectl describe deployment todo-api -n todo | grep -E "Progressing|Available|Reason"
for i in 1 2 3; do curl -s -o /dev/null -w "%{http_code}\n" -H "Host: todo.localhost" http://localhost:8080/health; sleep 10; done
```

Verification apres rollback:

```bash
curl -sS -H "Host: todo.localhost" http://localhost:8080/health
curl -sS -H "Host: todo.localhost" http://localhost:8080/api/tasks
kubectl get deploy,po -n todo -l app=todo-api
```

## 7. Tableau de diagnostic (phase 10)

La table ci-dessous doit rester synchronisee avec les signatures observees dans le cluster.

| Panne | Signature dans kubectl get pods | Signature dans describe/events | Se repare seule ? | Remede |
| :---- | :---- | :---- | :----: | :---- |
| Pod supprime | un pod `todo-api` disparait puis un nouveau pod apparait | events `SuccessfulDelete` puis `SuccessfulCreate` | Oui | Aucun, attendre la reconciliation |
| Processus tue dans le conteneur | le pod reste present, `RESTARTS` du conteneur augmente (attendu +1) | `Last State: Terminated` puis restart du conteneur dans `kubectl describe pod` | Oui | Aucun, confirmer la stabilisation du pod |
| Tag image inexistant | pod en `ErrImagePull`/`ImagePullBackOff` | `Failed to pull image`, `manifest not found` | Non | Remettre un tag image valide puis rollout |
| Cle Secret supprimee | pod en `CrashLoopBackOff` ou echec demarrage | reference secret incomplete, app ne demarre pas | Non | Restaurer la cle manquante puis restart/rollout |
| Limite memoire trop basse | pod en `CrashLoopBackOff` | `OOMKilled`, `Back-off restarting failed container` | Non | Retirer/augmenter `limits.memory`, reappliquer deployment |

Check evidence recommande pour le cas "processus tue":

```bash
POD=$(kubectl get pods -n todo -l app=todo-api -o jsonpath='{.items[0].metadata.name}')
kubectl get pod -n todo "$POD" -o jsonpath='{.status.containerStatuses[0].restartCount}{"\n"}'
kubectl exec -n todo "$POD" -- kill 1
kubectl get pod -n todo "$POD" -w
kubectl describe pod -n todo "$POD" | grep -E "Last State|Reason|Started|Finished"
```

## 8. Limite de sante a connaitre (phase 7)

`/health` ne prouve pas que la base PostgreSQL est disponible.

Consequence operationnelle:

1. Toujours verifier aussi une route metier (`/api/tasks`).
2. En incident DB, `/health` peut rester `200` pendant que la route metier renvoie `500`.

## 9. Verification de qualite du document

Avant passation:

1. Relecture froide: une personne externe doit comprendre chaque commande sans contexte oral.
2. Test d execution: rejouer un incident phase 10 et corriger les ambiguities immediatement.
3. Validation de sortie: cluster revenu nominal (`todo-api` pret, `/health=200`, `/api/tasks=200`).

## 10. Regles de rigueur

1. Ne jamais versionner `.env`, kubeconfig prive, cles, tokens.
2. Un objectif operationnel = un commit atomique.
3. Ne pas corriger a la main des ressources sans tracer la commande et la restauration.

Tests de robustesse recommandes avant passation:

1. Simuler un cas non prevu et verifier que la procedure guide bien le diagnostic (exemple: mauvais contexte kubectl).
2. Introduire une faute volontaire (SHA faux, nom deployment faux) et verifier que le point de controle suivant detecte l erreur rapidement.

