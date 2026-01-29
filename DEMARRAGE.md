# Guide de démarrage – Quizz API

Ce document explique comment faire fonctionner le projet **Quizz API** sur votre machine, de A à Z.

---

## Prérequis

Avant de commencer, assurez-vous d’avoir :

| Outil | Version recommandée | Vérification |
|-------|----------------------|---------------|
| **Node.js** | 18 ou plus récent | `node -v` |
| **npm** | 9 ou plus récent | `npm -v` |
| **MongoDB** | 6 ou 7 | `mongod --version` (ou MongoDB Atlas) |
| **Compte Google** | – | Pour créer les identifiants OAuth |

---

## 1. MongoDB

L’application utilise MongoDB pour les utilisateurs et les scores.

1. Installez MongoDB et lancez le service.
2. Par défaut, l’app se connecte à : `mongodb://localhost:27017/quizz-api`.

---

## 2. Variables d’environnement

### Backend (`server/`)

1. Copiez le fichier d’exemple :
   ```bash
   cd server
   cp .env.example .env
   ```

2. Éditez `server/.env` et renseignez :

   | Variable | Description | Exemple |
   |----------|-------------|---------|
   | `GOOGLE_CLIENT_ID` | ID client OAuth Google | `xxx.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | Secret OAuth Google | `GOCSPX-xxx` |
   | `SESSION_SECRET` | Secret pour les sessions | Chaîne aléatoire longue |
   | `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/quizz-api` ou URI Atlas |
   | `FRONTEND_URL` | URL du frontend | `http://localhost:5173` |
   | `BACKEND_URL` | URL du backend | `http://localhost:3000` |

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
5. **Authorized JavaScript origins** : ajoutez par exemple  
   `http://localhost:5173` (et plus tard votre IP ou domaine si besoin).
6. **Authorized redirect URIs** : ajoutez  
   `http://localhost:3000/auth/google/callback`.
7. Récupérez le **Client ID** et le **Client secret** et mettez-les dans `server/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

---

## 4. Installation des dépendances

À la racine du projet (ou dans chaque dossier) :

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

### Terminal 2 – Frontend

```bash
cd client
npm run dev
```


