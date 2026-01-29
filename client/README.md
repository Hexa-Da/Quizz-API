# Quizz API - Jeu de Complétion de Citations

Jeu interactif où vous devez compléter des citations en choisissant le mot manquant parmi 4 options.

## 🚀 Démarrage

### Backend
```bash
cd server
npm install
npm start
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 🏗️ Architecture

- **Frontend** : React + Vite
- **Backend** : Express.js (proxy vers ZenQuotes API)
- **API Externe** : ZenQuotes (`https://zenquotes.io/api/random`)

## 📝 Fonctionnement

1. Le backend récupère une citation depuis ZenQuotes API
2. Un mot est extrait automatiquement de la citation
3. Le frontend affiche la citation avec `_____` à la place du mot manquant
4. L'utilisateur choisit parmi 4 options
5. Le résultat et l'auteur sont affichés

## 🔧 Technologies

- React 19, Vite, Express.js, Axios
