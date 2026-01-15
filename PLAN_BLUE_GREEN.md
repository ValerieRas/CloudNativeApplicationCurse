# PLAN_BLUE_GREEN.md

## 🎯 Objective

Design and implement a **blue/green deployment strategy** for a containerized application  
(Vue.js frontend, NestJS backend, PostgreSQL) with **zero downtime**, **instant rollback**, and **CI-driven traffic switching** using an **Nginx reverse proxy**.

---

## 🧠 Core Principles

- Two application versions run **in parallel**: `blue` and `green`
- Only **one version receives user traffic** at any time
- A **single PostgreSQL database** is shared
- A **reverse proxy (Nginx)** controls traffic routing
- Deployments never stop the active production version
- Rollback must be **near-instantaneous**

---

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

## 🔄 Step 2 – Reverse Proxy Design (Nginx)

### 🎯 Goal

Introduce a **single entry point** that can switch traffic between
`blue` and `green` **without stopping containers or users noticing**.

---

### 🐳 Reverse Proxy Service

- A dedicated `reverse-proxy` container (Nginx)
- Exposes port **80**
- Routes traffic to:
  - `app-back-blue`
  - or `app-back-green`
- Frontend routing can be added later (same logic)

---

### ⚙️ Chosen Strategy: Dynamic Nginx Include (Option 1)

This project uses:

> **Two upstreams + a dynamically mounted include file**

#### Why this choice?

- Clear and explicit routing
- No Docker networking hacks
- Works well with CI-controlled config files
- Nginx reload is lightweight and safe

---

### 📄 Nginx Configuration Structure

**Main config (`nginx.conf`)**
```nginx
http {
  include /etc/nginx/conf.d/upstreams.conf;
  include /etc/nginx/conf.d/active.conf;

  server {
    listen 80;

    location / {
      proxy_pass http://active_backend;
    }
  }
}
```

**Upstreams (`upstreams.conf`)**
```nginx
upstream backend_blue {
  server app-back-blue:3000;
}

upstream backend_green {
  server app-back-green:3000;
}
```

**Active target (`active.conf`)**
```nginx
# Either:
set $active_backend backend_blue;
# or:
# set $active_backend backend_green;
```

➡️ Switching traffic = replacing `active.conf` + `nginx -s reload`

✔ No container restart  
✔ No downtime  

---

## 🧱 Step 3 – Docker Compose Structure

### 📁 File Separation

#### `docker-compose.base.yml`
Shared infrastructure:
- PostgreSQL (single instance)
- Reverse proxy (Nginx)
- Shared network and volumes

#### `docker-compose.blue.yml`
- `app-back-blue`
- `app-front-blue`
- Blue-tagged images
- Unique container names

#### `docker-compose.green.yml`
- `app-back-green`
- `app-front-green`
- Green-tagged images
- Same ports, same env, different names

---

### ▶️ Deployment Commands

Deploy **blue**:
```bash
docker compose -f docker-compose.base.yml \
               -f docker-compose.blue.yml up -d
```

Deploy **green** (without touching blue):
```bash
docker compose -f docker-compose.base.yml \
               -f docker-compose.green.yml up -d
```

✔ One color can be deployed independently  
✔ Proxy remains untouched  

---

## 🧪 Step 4 – CI-Driven Traffic Switching

### 1️⃣ Detect Active Color

- The active color is stored in:
  ```text
  reverse-proxy/conf/active_color.env
  ```
  Example:
  ```text
  ACTIVE_COLOR=blue
  ```

The CI reads this file to know:
- current production color
- next deployment target

---

### 2️⃣ Deploy Inactive Color

If `ACTIVE_COLOR=blue`:
- CI deploys **green**

```bash
docker compose -f docker-compose.base.yml \
               -f docker-compose.green.yml up -d
```

Health checks are executed before switching traffic.

---

### 3️⃣ Switch Reverse Proxy

CI updates:
```text
active.conf
```

From:
```nginx
set $active_backend backend_blue;
```

To:
```nginx
set $active_backend backend_green;
```

Then reloads Nginx:
```bash
docker exec reverse-proxy nginx -s reload
```

✔ Instant traffic switch  
✔ No container restart  

---

### 4️⃣ Rollback Strategy (Mandatory)

Rollback is **symmetrical** and immediate:

```bash
# Restore previous active.conf
docker exec reverse-proxy nginx -s reload
```

- No rebuild
- No redeploy
- No downtime

---

### 5️⃣ Optional Cleanup

Once the new version is validated:
- CI *may* stop the old color:
  ```bash
  docker compose stop app-back-blue app-front-blue
  ```
This step is optional and not required for rollback capability.

---

## ✅ Why This Strategy Meets the Requirements

- New version is deployed **without stopping the old one**
- Traffic switch is **atomic and reversible**
- Reverse proxy is the single source of truth
- CI controls deployment and routing
- Architecture mirrors **real production blue/green setups**

---

## 🏁 Conclusion

This blue/green deployment design:
- avoids risky in-place upgrades
- provides near-zero downtime
- enables instant rollback
- remains simple, auditable, and CI-friendly

It is intentionally designed to be **production-realistic**, not a toy example.
