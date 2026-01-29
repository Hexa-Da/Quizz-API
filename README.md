# Quizz API – Jeu de complétion de citations

Jeu interactif où vous devez compléter des citations en choisissant le mot manquant parmi 4 options. Connexion Google pour sauvegarder son meilleur score.

**→ Guide complet pour faire tourner le projet en local : [DEMARRAGE.md](./DEMARRAGE.md)**

---

## Architecture

| Couche | Stack | Hébergement (prod) |
|--------|--------|---------------------|
| **Frontend** | React 19 + Vite | Netlify |
| **Backend** | Express.js | Render |
| **Base de données** | MongoDB (Mongoose) | MongoDB Atlas |

---

## Fonctionnement

1. L’utilisateur se connecte avec **Google OAuth** (optionnel pour jouer, requis pour enregistrer le score).
2. Le backend sélectionne une **citation aléatoire** parmi une liste de citations drôles (source : Ouest-France).
3. La citation est affichée avec `_____` à la place du mot manquant.
4. L’utilisateur choisit parmi **4 options** ; le résultat et l’auteur sont affichés.
5. Le **meilleur score** est sauvegardé en base (si connecté) et affiché.

---

## Technologies

- **Frontend** : React 19, Vite
- **Backend** : Express 5, CORS, sessions, JWT
- **Auth** : Passport.js avec Google OAuth 2.0
- **Base** : MongoDB avec Mongoose

---

## Scripts

### Backend (`server/`)

| Script | Commande | Description |
|--------|----------|-------------|
| `start` | `npm start` | Lance le serveur (`node index.js`). Utilisé en production (Render). |
| `test` | `npm test` | Placeholder (aucun test pour l’instant). |

### Frontend (`client/`)

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `npm run dev` | Serveur de développement Vite (hot reload). |
| `build` | `npm run build` | Build de production → dossier `dist/` (déployé sur Netlify). |
| `preview` | `npm run preview` | Prévisualise le build localement. |
| `lint` | `npm run lint` | Lance ESLint. |

---

## API (backend)

| Méthode | Route | Auth | Description |
|--------|--------|------|-------------|
| GET | `/` | Non | Message de bienvenue + infos API. |
| GET | `/health` | Non | Health check : statut app + MongoDB (200 si OK, 503 si DB déconnectée). |
| GET | `/auth/google` | Non | Redirige vers la page de connexion Google. |
| GET | `/auth/google/callback` | Non | Callback OAuth ; redirige vers le frontend avec un token JWT dans l’URL. |
| GET | `/auth/logout` | Non | Réponse « Déconnexion réussie ». |
| GET | `/api/user` | JWT | Retourne l’utilisateur connecté. |
| POST | `/api/score` | JWT | Met à jour le meilleur score (body : `{ "score": number }`). |
| GET | `/api/quote` | Non | Retourne une citation aléatoire avec options. |

---

## Déploiement (Netlify + Render + Atlas)

### Backend (Render)

1. Créer un **Web Service** relié au repo (dossier `server/` ou racine avec build command adaptée).
2. **Build** : `npm install` (ou `npm ci`). **Start** : `npm start`.
3. **Variables d’environnement** (obligatoires) :
   - `MONGODB_URI` (URI Atlas)
   - `JWT_SECRET`, `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `FRONTEND_URL` = URL Netlify (ex. `https://votre-app.netlify.app`)
   - `BACKEND_URL` = URL Render (ex. `https://votre-api.onrender.com`)
4. **Health check** : dans les paramètres du service, définir **Health Check Path** = `/health`.

Dans [Google Cloud Console](https://console.cloud.google.com/), ajouter dans les **Authorized redirect URIs** : `https://votre-api.onrender.com/auth/google/callback`.

### Frontend (Netlify)

1. Créer un site relié au repo (dossier `client/` ou racine avec build config).
2. **Build command** : `npm run build`. **Publish directory** : `dist`.
3. **Variable d’environnement** : `VITE_API_URL` = URL du backend Render (ex. `https://votre-api.onrender.com`).

Le fichier `client/public/_redirects` (règle `/* → /index.html`) assure le routage SPA sur Netlify.

### Base de données (MongoDB Atlas)

- Créer un cluster (gratuit ou payant).
- Récupérer l’URI de connexion et la mettre dans `MONGODB_URI` sur Render.
- Optionnel : restreindre l’accès par IP (liste blanche Render) dans Atlas.

---

## Variables d’environnement (résumé)

| Fichier | Variables principales |
|---------|------------------------|
| `server/.env` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `JWT_SECRET`, `MONGODB_URI`, `FRONTEND_URL`, `BACKEND_URL`, `PORT` |
| `client/.env` | `VITE_API_URL` |

Voir [DEMARRAGE.md](./DEMARRAGE.md) pour le détail et les exemples.

---

## Structure du projet

```
Quizz-API/
├── client/                 # Frontend React + Vite
│   ├── public/
│   │   └── _redirects      # SPA redirect pour Netlify
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── .env.example
│   └── package.json
├── server/                 # Backend Express
│   ├── config/
│   │   └── database.js     # Connexion MongoDB
│   ├── models/
│   │   └── User.js
│   ├── .env.example
│   ├── index.js            # Routes + logique
│   └── package.json
├── DEMARRAGE.md            # Guide de démarrage détaillé
├── README.md               # Ce fichier
└── AUDIT-REPORT.md         # Rapport d’audit sécurité / déploiement (optionnel)
```

---

## Licence

ISC (voir `package.json`).
