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

1. L’utilisateur se connecte avec **Google OAuth** 
2. Le backend sélectionne une **citation aléatoire** parmi une liste de citations drôles (source : Ouest-France).
3. La citation est affichée avec `_____` à la place du mot manquant.
4. L’utilisateur choisit parmi **4 options** ; le résultat et l’auteur sont affichés.
5. Le **meilleur score** est sauvegardé en base et affiché.

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

---

## API (backend)

| Méthode | Route | Auth | Description |
|--------|--------|------|-------------|
| GET | `/` | Non | Message de bienvenue + infos API. |
| GET | `/health` | Non | Health check : statut app + MongoDB. |
| GET | `/auth/google` | Non | Redirige vers la page de connexion Google. |
| GET | `/auth/google/callback` | Non | Callback OAuth ; redirige vers le frontend avec un token JWT. |
| GET | `/auth/logout` | Non | Réponse « Déconnexion réussie ». |
| GET | `/api/user` | JWT | Retourne l’utilisateur connecté. |
| POST | `/api/score` | JWT | Met à jour le meilleur score. |
| GET | `/api/quote` | Non | Retourne une citation aléatoire avec options. |
| GET | `/api/celebrity-image` | Non | Retourne l’image d’une célébrité (Wikipedia). |

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
│   │   ├── User.js
│   │   └── Quote.js
│   ├── scripts/
│   │   └── seed-quotes.js  # Peupler la base de citations
│   ├── .env.example
│   ├── index.js            # Routes + logique
│   └── package.json
├── DEMARRAGE.md            # Guide de démarrage détaillé
└── README.md               # Ce fichier
```

