const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Liste de citations mock (5-10 citations)
const quotes = [
  "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.",
  "Le succès, c'est tomber sept fois, se relever huit.",
  "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.",
  "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
  "L'éducation est l'arme la plus puissante qu'on puisse utiliser pour changer le monde.",
  "Le courage n'est pas l'absence de peur, mais la capacité de vaincre ce qui fait peur.",
  "La simplicité est la sophistication suprême.",
  "L'imagination est plus importante que le savoir.",
  "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.",
  "Ne vous inquiétez pas de l'échec, inquiétez-vous des chances que vous manquez si vous n'essayez même pas."
];

// Route pour obtenir une citation aléatoire
app.get('/api/quote', (req, res) => {
  // Sélectionner une citation aléatoire
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  
  res.json({ quote: randomQuote });
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'API Quizz est en ligne !' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});