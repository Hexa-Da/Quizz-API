# Guide de démarrage – Quizz API

Ce document explique comment faire fonctionner le projet **Quizz API** en local.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

| Outil | Version recommandée | Vérification |
|-------|---------------------|---------------|
| **Node.js** | 18 ou plus récent | `node -v` |
| **npm** | 9 ou plus récent | `npm -v` |
| **MongoDB** | 6 ou 7 (local ou Atlas) | `mongod --version` ou compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |
| **Compte Google** | Pour l'authentification OAuth | [Google Cloud Console](https://console.cloud.google.com/) |

---

## 1. MongoDB

L'application utilise MongoDB pour stocker les **utilisateurs** (Google OAuth), leurs **meilleurs scores** et les **citations** du jeu.

- Créez un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Récupérez l'URI de connexion (ex. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/quizz-api?retryWrites=true&w=majority`).
- Indiquez cette URI dans le fichier `server/.env` (voir section suivante).

---

## 2. Variables d'environnement

### Backend (`server/`)

1. Copiez le fichier d'exemple :
   ```bash
   cd server
   cp .env.example .env
   ```

2. Éditez `server/.env` et renseignez :

   | Variable | Obligatoire | Description | Exemple |
   |----------|-------------|-------------|---------|
   | `GOOGLE_CLIENT_ID` | Oui | ID client OAuth Google | `votre-id.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | Oui | Secret OAuth Google | `GOCSPX-votre-secret` |
   | `SESSION_SECRET` | Oui | Secret pour les sessions Express | Chaîne aléatoire longue |
   | `JWT_SECRET` | Oui | Secret pour signer les tokens JWT | Chaîne aléatoire longue |
   | `MONGODB_URI` | Oui | URI de connexion MongoDB | `mongodb://localhost:27017/quizz-api` ou URI Atlas |
   | `PORT` | Non | Port du serveur (défaut : 3000) | `3000` |
   | `FRONTEND_URL` | Oui (CORS) | URL du frontend | `http://localhost:5173` (dev) |
   | `BACKEND_URL` | Oui (OAuth) | URL du backend (callback Google) | `http://localhost:3000` (dev) |
   | `NODE_ENV` | Non | `development` ou `production` | `development` |

### Frontend (`client/`)

1. Copiez le fichier d'exemple :
   ```bash
   cd client
   cp .env.example .env
   ```

2. Éditez `client/.env` :

   | Variable | Description | Exemple |
   |----------|-------------|---------|
   | `VITE_API_URL` | URL de l'API (backend) | `http://localhost:3000` |

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
   (et en production l'URL Render, ex. `https://votre-api.onrender.com/auth/google/callback`).
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

## 5. Peupler la base de citations

Le jeu a besoin de citations en base. Depuis le dossier `server/`, exécutez une fois le script de seed :

```bash
cd server
node scripts/seed-quotes.js
```

Cela insère les citations (source Ouest-France) dans la collection MongoDB. Sans cette étape, le jeu n'affichera aucune question.

---

## 6. Lancer le projet

Vous devez lancer **deux processus** : le serveur API puis le frontend.

### Terminal 1 – Backend

```bash
cd server
npm start
```

Le serveur démarre sur `http://localhost:3000`. Il attend que MongoDB soit connecté avant d'écouter les requêtes.

### Terminal 2 – Frontend

```bash
cd client
npm run dev
```

Le frontend est disponible sur `http://localhost:5173`. Ouvrez cette URL dans le navigateur.
