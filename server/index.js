const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

const EXTERNAL_API_URL = 'https://zenquotes.io/api/random';


// Fonction pour mélanger un tableau
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Fonction pour extraire un mot intéressant d'une phrase
function extractWordFromQuote(text) {
    // Nettoyer le texte (enlever la ponctuation)
    const cleanText = text.replace(/[.,!?;:]/g, '');
    // Séparer en mots
    const words = cleanText.split(/\s+/).filter(word => word.length > 3);
    
    if (words.length === 0) return null;
    
    // Choisir un mot au milieu de la phrase (plus intéressant)
    const middleIndex = Math.floor(words.length / 2);
    return words[middleIndex].toLowerCase();
}

// Fonction pour générer des options de réponse
function generateOptions(correctWord) {
    // Options de base (vous pouvez les personnaliser)
    const commonWords = [
      'time', 'life', 'love', 'work', 'success', 'dream', 'hope', 'truth',
      'courage', 'wisdom', 'beauty', 'freedom', 'peace', 'joy', 'faith',
      'power', 'mind', 'heart', 'soul', 'spirit', 'light', 'dark', 'path',
      'journey', 'destiny', 'fate', 'chance', 'luck', 'fortune', 'glory',
      'danger', 'opportunity', 'strength', 'weakness', 'victory', 'defeat'
    ];

    // Filtrer pour éviter les doublons
    const wrongOptions = commonWords
    .filter(word => word !== correctWord && word.length > 3)
    .slice(0, 3);

    // Mélanger avec la bonne réponse
    return shuffleArray([correctWord, ...wrongOptions]);
}

// Route pour obtenir une citation depuis l'API externe ZenQuotes
app.get('/api/quote', async (req, res) => {
    try {
      // Étape 1 : Appeler l'API externe ZenQuotes
      console.log('📡 Appel à l\'API externe ZenQuotes...');
      const response = await axios.get(EXTERNAL_API_URL);
      
      // ZenQuotes retourne un tableau avec un objet
      // Format: [{"q":"citation", "a":"auteur", "h":"html"}]
      const quoteData = response.data[0];
      
      // Étape 2 : Extraire le texte de la citation (propriété 'q')
      const quoteText = quoteData.q;
      
      // Étape 3 : Extraire un mot à compléter
      const missingWord = extractWordFromQuote(quoteText);
      
      // Étape 4 : Créer le texte avec placeholder
      const regex = new RegExp(`\\b${missingWord}\\b`, 'gi');
      const textWithPlaceholder = quoteText.replace(regex, '_____');
      
      // Étape 5 : Générer les options de réponse
      const options = generateOptions(missingWord);
      
      // Étape 6 : Retourner les données au format attendu par le frontend
      res.json({
        id: Date.now(), // ZenQuotes ne fournit pas d'ID
        text: textWithPlaceholder,
        fullText: quoteText,
        author: quoteData.a || 'Auteur inconnu',
        correctAnswer: missingWord,
        options: options
      });
      
      console.log('✅ Citation transformée et envoyée au frontend');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel à l\'API externe:', error.message);
    }
});


// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.json({ 
      message: 'API Quizz est en ligne !',
      externalApi: 'Utilise ZenQuotes API',
      endpoint: '/api/quote',
      apiUrl: EXTERNAL_API_URL
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}\n`);
});
