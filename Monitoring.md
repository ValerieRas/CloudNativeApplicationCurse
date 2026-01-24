# 📊 Monitoring & Observabilité

## 1. Introduction
Ce document présente une stack de **monitoring et d’observabilité** basée sur **Prometheus, Grafana, Loki et Promtail**. Il explique le rôle de chaque composant, leurs interactions, ainsi que l’intégration d’une application au sein de cette stack.

---

## 2. Monitoring vs Observabilité

### 🔍 Monitoring
Le **monitoring** consiste à **surveiller l’état d’un système** à l’aide de métriques et d’alertes prédéfinies.
- Question principale : *“Est-ce que le système fonctionne ?”*
- Exemple : CPU > 80 %, service down, mémoire saturée.

### 👁️ Observabilité
L’**observabilité** vise à **comprendre pourquoi un problème se produit** en analysant différentes sources de données.
- Question principale : *“Pourquoi le système se comporte-t-il ainsi ?”*
- Elle repose sur l’analyse conjointe de plusieurs signaux.

---

## 3. Les 3 piliers de l’observabilité

1. **Métriques** 📈  
   Données chiffrées mesurées dans le temps (CPU, RAM, requêtes/seconde).

2. **Logs** 📜  
   Journaux textuels décrivant les événements du système.

3. **Traces** 🔗  
   Suivi du parcours d’une requête à travers plusieurs services.

> ⚠️ Dans cette stack, nous utilisons **métriques et logs**, pas de traces.

---

## 4. Rôle des composants

### 🟢 Prometheus
- Outil de **collecte de métriques**
- Récupère les métriques via le mécanisme de **scraping HTTP**
- Stocke les données sous forme de séries temporelles
- Utilise le langage **PromQL** pour les requêtes

👉 Pilier : **Métriques**

---

### 📊 Grafana
- Outil de **visualisation**
- Se connecte à Prometheus (métriques) et Loki (logs)
- Permet de créer des **dashboards** et **alertes**

👉 Interface centrale pour l’observabilité

---

### 🟣 Loki
- Système de **centralisation des logs**
- Optimisé pour être léger (indexe peu les logs)
- Les logs sont corrélés avec les métriques via les labels

👉 Pilier : **Logs**

---

### 🟡 Promtail
- **Agent de collecte de logs**
- Lit les fichiers de logs (ou stdout de conteneurs)
- Envoie les logs vers Loki

👉 Pont entre l’application et Loki

---

## 5. Architecture globale

```text
            ┌────────────┐
            │ Application│
            │ (logs +    │
            │ métriques) │
            └─────┬──────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌──────────────┐     ┌──────────────┐
│  Prometheus  │     │   Promtail   │
│ (scraping)  │     │ (logs agent) │
└──────┬───────┘     └──────┬───────┘
       │                    │
       │                    ▼
       │              ┌──────────┐
       │              │   Loki   │
       │              │ (logs)  │
       │              └────┬────┘
       │                   │
       ▼                   ▼
                ┌────────────────┐
                │    Grafana     │
                │ Dashboards UI │
                └────────────────┘
```

---

## 6. Intégration de l’application

### 📌 Métriques
- L’application expose un endpoint `/metrics`
- Prometheus interroge cet endpoint à intervalle régulier (scraping)

### 📌 Logs
- L’application écrit ses logs dans des fichiers ou sur la sortie standard
- Promtail lit ces logs et les envoie à Loki

### 📌 Visualisation
- Grafana affiche :
  - Les métriques depuis Prometheus
  - Les logs depuis Loki
- Les deux peuvent être corrélés dans un même dashboard

---

## 7. Ports d’exécution par défaut

| Composant    | Port |
|--------------|------|
| Prometheus   | 9090 |
| Grafana      | 3000 |
| Loki         | 3100 |
| Promtail     | 9080 (metrics) |
| Application  | Variable (ex: 8080) |

---

## 8. Conclusion
Cette stack permet :
- De **surveiller** l’état du système (monitoring)
- De **comprendre** les incidents grâce aux logs et métriques (observabilité)
- D’avoir une vue centralisée et exploitable via Grafana

Elle constitue une base solide pour un environnement moderne cloud / microservices.


