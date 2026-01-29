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
- **Backend** : Express.js (API interne)
- **Source** : Citations drôles d'Ouest-France

## 📝 Fonctionnement

1. Le backend sélectionne une citation aléatoire parmi les citations drôles stockées
2. La citation est affichée avec `_____` à la place du mot manquant
3. L'utilisateur choisit parmi 4 options
4. Le résultat et l'auteur sont affichés après la réponse

## 🔧 Technologies

- React 19, Vite, Express.js
