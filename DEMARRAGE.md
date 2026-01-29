# Guide de démarrage – Quizz API

Ce document explique comment faire fonctionner le projet **Quizz API** sur votre machine, de A à Z.

---

## Prérequis

Avant de commencer, assurez-vous d’avoir :

| Outil | Version recommandée | Vérification |
|-------|---------------------|---------------|
| **Node.js** | 18 ou plus récent | `node -v` |
| **npm** | 9 ou plus récent | `npm -v` |
| **MongoDB** | 6 ou 7 (local ou Atlas) | `mongod --version` ou compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |
| **Compte Google** | – | Pour créer les identifiants OAuth |

---

## 1. MongoDB

L’application utilise MongoDB pour stocker les utilisateurs (Google OAuth) et leurs meilleurs scores.

- **Option locale** : installez MongoDB et lancez le service. Par défaut, l’app se connecte à `mongodb://localhost:27017/quizz-api`.
- **Option Atlas** : créez un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), récupérez l’URI de connexion (ex. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/quizz-api?retryWrites=true&w=majority`) et mettez-la dans `server/.env` (voir ci‑dessous).

---

## 2. Variables d’environnement

### Backend (`server/`)

1. Copiez le fichier d’exemple :
   ```bash
   cd server
   cp .env.example .env
   ```

2. Éditez `server/.env` et renseignez :

   | Variable | Obligatoire | Description | Exemple |
   |----------|-------------|-------------|---------|
   | `GOOGLE_CLIENT_ID` | Oui | ID client OAuth Google | `xxx.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | Oui | Secret OAuth Google | `GOCSPX-xxx` |
   | `SESSION_SECRET` | Oui | Secret pour les sessions Express | Chaîne aléatoire longue |
   | `JWT_SECRET` | Oui | Secret pour signer les tokens JWT | Chaîne aléatoire longue |
   | `MONGODB_URI` | Oui | URI de connexion MongoDB | `mongodb://localhost:27017/quizz-api` ou URI Atlas |
   | `PORT` | Non | Port du serveur (défaut : 3000) | `3000` |
   | `FRONTEND_URL` | Oui (CORS) | URL du frontend | `http://localhost:5173` (dev) |
   | `BACKEND_URL` | Oui (OAuth) | URL du backend (callback Google) | `http://localhost:3000` (dev) |
   | `NODE_ENV` | Non | `development` ou `production` | Optionnel en local |

### Frontend (`client/`)

1. Copiez le fichier d’exemple :
   ```bash
   cd client
   cp .env.example .env
   ```

2. Éditez `client/.env` :

   | Variable | Description | Exemple |
   |----------|-------------|---------|
   | `VITE_API_URL` | URL de l’API (backend) | `http://localhost:3000` |

---

## 3. Google OAuth (connexion avec Google)

Pour que le bouton « Se connecter avec Google » fonctionne :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un projet ou sélectionnez-en un.
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. Type : **Web application**.
5. **Authorized JavaScript origins** : ajoutez  
   `http://localhost:5173` (et en production votre domaine Netlify, ex. `https://votre-app.netlify.app`).
6. **Authorized redirect URIs** : ajoutez  
   `http://localhost:3000/auth/google/callback`  
   (et en production l’URL Render, ex. `https://votre-api.onrender.com/auth/google/callback`).
7. Récupérez le **Client ID** et le **Client secret** et mettez-les dans `server/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

---

## 4. Installation des dépendances

À la racine du projet, installez le backend et le frontend :

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## 5. Lancer le projet

Vous devez lancer **deux processus** : le serveur API puis le frontend.

### Terminal 1 – Backend

```bash
cd server
npm start
```

Le serveur démarre sur `http://localhost:3000`. Il attend que MongoDB soit connecté avant d’écouter les requêtes.

### Terminal 2 – Frontend

```bash
cd client
npm run dev
```

Le frontend est disponible sur `http://localhost:5173`. Ouvrez cette URL dans le navigateur.

---

## 6. Vérifier que tout fonctionne

- **Backend** : ouvrez `http://localhost:3000` → vous devez voir un JSON avec un message de bienvenue et le nombre de citations.
- **Health check** : `http://localhost:3000/health` → renvoie `{"status":"ok","db":"connected"}` si la base est connectée.
- **Frontend** : sur `http://localhost:5173`, cliquez sur « Se connecter avec Google » ; après connexion, les citations s’affichent et le meilleur score est sauvegardé.

---

## 7. Build de production (optionnel)

Pour tester un build proche de la production :

```bash
# Frontend : génère client/dist/
cd client
npm run build

# Backend : même commande qu’en dev
cd ../server
npm start
```

Le frontend buildé peut être servi par n’importe quel serveur statique pointant vers `client/dist/` ; en production, le frontend est hébergé sur Netlify et le backend sur Render (voir [README.md](./README.md)).
