const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Liste de citations avec mot manquant et options
const quotes = [
  {
    id: 1,
    text: "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.",
    missingWord: "mystère",
    options: ["mystère", "secret", "énigme", "puzzle"]
  },
  {
    id: 2,
    text: "Le succès, c'est tomber sept fois, se relever huit.",
    missingWord: "huit",
    options: ["huit", "neuf", "sept", "dix"]
  },
  {
    id: 3,
    text: "L'avenir appartient à ceux qui croient en la beauté de leurs rêves.",
    missingWord: "rêves",
    options: ["rêves", "espoirs", "projets", "idées"]
  },
  {
    id: 4,
    text: "La seule façon de faire du bon travail est d'aimer ce que vous faites.",
    missingWord: "aimer",
    options: ["aimer", "faire", "créer", "vivre"]
  },
  {
    id: 5,
    text: "L'éducation est l'arme la plus puissante qu'on puisse utiliser pour changer le monde.",
    missingWord: "puissante",
    options: ["puissante", "efficace", "importante", "nécessaire"]
  },
  {
    id: 6,
    text: "Le courage n'est pas l'absence de peur, mais la capacité de vaincre ce qui fait peur.",
    missingWord: "courage",
    options: ["courage", "force", "bravoure", "détermination"]
  },
  {
    id: 7,
    text: "La simplicité est la sophistication suprême.",
    missingWord: "simplicité",
    options: ["simplicité", "clarté", "élégance", "beauté"]
  },
  {
    id: 8,
    text: "L'imagination est plus importante que le savoir.",
    missingWord: "imagination",
    options: ["imagination", "créativité", "intuition", "inspiration"]
  },
  {
    id: 9,
    text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.",
    missingWord: "maintenant",
    options: ["maintenant", "aujourd'hui", "immédiatement", "désormais"]
  },
  {
    id: 10,
    text: "Ne vous inquiétez pas de l'échec, inquiétez-vous des chances que vous manquez si vous n'essayez même pas.",
    missingWord: "échec",
    options: ["échec", "erreur", "défaite", "perte"]
  }
];

// Fonction pour mélanger un tableau
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Route pour obtenir une citation aléatoire avec mot manquant
app.get('/api/quote', (req, res) => {
  // Sélectionner une citation aléatoire
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const selectedQuote = quotes[randomIndex];
  
  // Créer le texte avec placeholder
  const textWithPlaceholder = selectedQuote.text.replace(
    selectedQuote.missingWord,
    '_____'
  );
  
  // Mélanger les options
  const shuffledOptions = shuffleArray(selectedQuote.options);
  
  // Retourner la citation avec placeholder et options mélangées
  res.json({
    id: selectedQuote.id,
    text: textWithPlaceholder,
    fullText: selectedQuote.text,
    correctAnswer: selectedQuote.missingWord,
    options: shuffledOptions
  });
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'API Quizz est en ligne !' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
