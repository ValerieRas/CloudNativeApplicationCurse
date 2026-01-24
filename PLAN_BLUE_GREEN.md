# PLAN_BLUE_GREEN.md

## 1. Recherches & Compréhension

### Comment organiser plusieurs services Docker pour le même rôle ?
Pour permettre à deux versions (Blue et Green) de cohabiter sur le même serveur sans conflit de ports ou de noms, nous utilisons une convention de nommage par suffixe dans nos fichiers Docker Compose :
* **Version Blue :** Les services sont nommés `app-back-blue` et `app-front-blue`.
* **Version Green :** Les services sont nommés `app-back-green` et `app-front-green`.

Tous ces conteneurs rejoignent un réseau externe commun nommé `bluegreen-net`. Cela permet au Reverse Proxy (situé sur le même réseau) de communiquer avec n'importe quelle couleur via son nom de conteneur, indépendamment de la version active.


## 🧱 Global Architecture

```text
                ┌───────────────┐
                │   Users       │
                └───────┬───────┘
                        │
                 ┌──────▼───────┐
                 │   NGINX      │
                 │ ReverseProxy │
                 └──────┬───────┘
            ┌───────────┴───────────┐
            │                       │
     ┌──────▼──────┐         ┌──────▼──────┐
     │ BLUE stack  │         │ GREEN stack │
     │ Front + API │         │ Front + API │
     └──────┬──────┘         └──────┬──────┘
            │                       │
            └───────────┬───────────┘
                        │
                 ┌──────▼──────┐
                 │ PostgreSQL  │
                 │  (shared)   │
                 └─────────────┘
```

---



### Comment éviter qu’un `docker compose up` modifie tous les services ?
Docker Compose est conçu pour être "idempotent" : il ne redémarre un conteneur que si sa configuration ou son image a changé.
Pour garantir une isolation parfaite lors des déploiements :
1.  Nous avons **séparé les définitions** dans des fichiers distincts (`.blue.yml`, `.green.yml`).
2.  Lors d'un déploiement (ex: vers Green), nous incluons les définitions de Green et de l'infrastructure de base.
3.  Docker détecte que l'infrastructure n'a pas changé et ne la redémarre pas. Il ne touche pas non plus aux conteneurs Blue s'ils sont inclus dans la commande mais n'ont pas de changements d'image.

### Comment séparer clairement le routage des versions applicatives ?
Nous séparons les responsabilités dans des fichiers distincts :
* **Infrastructure (Routage & Données) :** Le fichier `docker-compose.base.yml` gère le Reverse Proxy (Nginx) et la Base de données. Ces services sont stables et redémarrent rarement.
* **Applicatif (Versions) :** Les fichiers `docker-compose.blue.yml` et `docker-compose.green.yml` ne contiennent que le code métier (Frontend + Backend). C'est uniquement cette partie qui change à chaque déploiement.

---

## 2. Solution Technique

### Fichiers de Composition Docker
Nous utilisons **3 fichiers principaux** pour cette architecture :

1.  **`docker-compose.base.yml`**
    * **Contenu :** Reverse Proxy (Nginx), PostgreSQL.
    * **Rôle :** Infrastructure persistante.
2.  **`docker-compose.blue.yml`**
    * **Contenu :** `app-back-blue`, `app-front-blue`.
    * **Rôle :** Stack applicative "Blue".
3.  **`docker-compose.green.yml`**
    * **Contenu :** `app-back-green`, `app-front-green`.
    * **Rôle :** Stack applicative "Green".

*(Note : `docker-compose.proxy.yml` n'est pas utilisé car le proxy est intégré à la `base` pour simplifier la gestion réseau).*

### Lancement de l'ensemble
Pour éviter que Docker ne considère les conteneurs de la couleur inactive comme "orphelins" (ce qui provoquerait leur arrêt), nous combinons tous les fichiers lors de la commande de démarrage. Cela garantit que **Blue et Green restent actifs simultanément**.

**Commande concrète :**
```bash
docker-compose -f docker-compose.base.yml -f docker-compose.green.yml -f docker-compose.blue.yml up -d
```

## 1. Mécanisme de bascule Nginx (Côté Proxy)

Nous n'utilisons pas de variables d'environnement (qui nécessitent un redémarrage lourd du conteneur), mais un système d'**inclusion dynamique de fichier**.

### Le Principe
1.  **Configuration :** Nginx inclut un fichier spécifique via la directive `include /etc/nginx/conf.d/active_upstream.conf;` définie dans le bloc `server`.
2.  **Contenu :** Ce fichier définit une variable, par exemple : `set $active_backend "app-front-green:80";`.
3.  **Action :** Le script de déploiement écrase ce fichier texte avec la nouvelle cible, puis recharge la configuration à chaud sans couper les connexions actives :
    ```bash
    docker exec reverse-proxy nginx -s reload
    ```

---

## 2. Scénario de Déploiement

### État Initial
* **Prod :** La couleur **Blue** est active.
* **Proxy :** Redirige le trafic vers `app-front-blue`.
* **État :** Le fichier `.active_color` contient "blue".

### Nouveau Déploiement (Happy Path)
1.  **Ciblage :** Le pipeline lit `.active_color` (blue), il décide donc de déployer sur **Green**.
2.  **Mise à jour :** Le pipeline télécharge les nouvelles images pour Green.
3.  **Démarrage :** Lancement des conteneurs Green. **Blue reste allumé** et continue de servir les clients.
4.  **Validation (Healthcheck) :** Le script teste la connectivité interne vers `app-front-green`.
5.  **Bascule :**
    * Si le test est OK : Le fichier de config Nginx est mis à jour vers Green + Reload Nginx.
    * Le fichier `.active_color` est mis à jour avec "green".

### Retour en arrière (Rollback)
Si la nouvelle version (Green) est défaillante (bug métier) après la bascule :
* Comme l'ancienne version (Blue) n'a pas été arrêtée, elle est toujours prête (Hot Standby).
* **Action :** On remet la configuration Nginx sur `app-front-blue` et on reload.
* **Temps de rétablissement :** Quasi instantané (< 1 seconde).

---

## 3. Documentation de la Logique de Bascule

### Où est stockée la couleur active ?
L'état est persisté dans un fichier texte local nommé `.active_color` situé à la racine du projet sur le serveur de déploiement (Runner).
* Contenu possible : `blue` ou `green`.

### Comment le pipeline détermine la prochaine cible ?
Le script PowerShell (`deploy.ps1`) lit ce fichier :
* Si `.active_color` == `blue` ➔ Cible = `green`.
* Si `.active_color` == `green` ➔ Cible = `blue`.
* Si fichier absent ➔ Cible par défaut = `green` (en considérant Blue comme état initial implicite).

### Quel est le mécanisme de rollback ?
Le système offre deux niveaux de protection :

1.  **Rollback Préventif (Automatique) :**
    Si la nouvelle stack (Green) ne passe pas le healthcheck (ne répond pas sous 60 secondes après démarrage), le script l'éteint immédiatement et ne modifie jamais le routage Nginx. Les utilisateurs restent sur Blue sans interruption.

2.  **Rollback Curatif (Manuel) :**
    Puisque l'ancienne stack reste allumée ("Hot Standby"), il est possible de revenir en arrière instantanément. Un script de rollback (ou un job manuel) modifie le fichier `active_upstream.conf` pour pointer vers l'ancienne couleur et recharge Nginx.

