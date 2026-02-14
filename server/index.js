const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const User = require('./models/User');
const Quote = require('./models/Quote');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Constantes
const DEFAULT_PORT = 3000;
const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;
const DB_CONNECTED_STATE = 1;
const SAMPLE_SIZE = 1;
const WIKI_THUMB_SIZE = 500;
const WIKI_REDIRECT = 1;
const TOKEN_EXPIRY = '24h';
const CACHE_TTL_SECONDS = 3600; // 1h en secondes
const MS_PER_SECOND = 1000;
const WORD_PLACEHOLDER = '_____';
const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const WIKI_USER_AGENT = 'QuizzAPI/1.0 (https://github.com/Hexa-Da/Quizz-API)';

const app = express();
const PORT = process.env.PORT || DEFAULT_PORT;

// Indiquer que l'app est derrière un proxy (Render)
app.set('trust proxy', 1);

// Middleware
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Configuration Passport Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${BACKEND_URL}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ id: profile.id });

    if (user) {
      user.email = profile.emails[0].value;
      user.name = profile.displayName;
      user.photo = profile.photos[0].value;
      await user.save();
    } else {
      user = await User.create({
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        photo: profile.photos[0].value,
        bestScore: 0
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}
));

// Middleware pour vérifier le token JWT (async/await)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ id: String(decoded.id) });

    if (!user) {
      return res.status(403).json({ error: 'Utilisateur introuvable' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Routes d'authentification
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/?error=login` }),
  (req, res) => {
    const user = req.user;

    const userPayload = {
      id: String(user.id),
      email: user.email
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.redirect(`${FRONTEND_URL}/?token=${encodeURIComponent(token)}`);
  }
);

app.get('/auth/logout', (req, res) => {
  return res.json({ message: 'Déconnexion réussie' });
});

// Route pour obtenir l'utilisateur actuel
app.get('/api/user', verifyToken, (req, res) => {
  return res.json(req.user);
});

// Route pour mettre à jour le meilleur score
app.post('/api/score', verifyToken, async (req, res) => {
  try {
    const { score } = req.body;
    const num = Number(score);

    if (typeof score === 'undefined' || Number.isNaN(num) || num < 0 || !Number.isInteger(num)) {
      return res.status(400).json({ error: 'Score invalide (entier >= 0 attendu)' });
    }

    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (num > user.bestScore) {
      user.bestScore = num;
      await user.save();
    }

    return res.json({ bestScore: user.bestScore });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du score: %s', error.message);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du score' });
  }
});

// Fonction pour mélanger un tableau (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Route pour obtenir une citation drôle
app.get('/api/quote', async (req, res) => {
  try {
    const results = await Quote.aggregate([{ $sample: { size: SAMPLE_SIZE } }]);
    const selectedQuote = results[0];

    if (!selectedQuote) {
      return res.status(404).json({ error: 'Aucune citation disponible' });
    }

    const regex = new RegExp(`\\b${selectedQuote.missingWord}\\b`, 'gi');
    const textWithPlaceholder = selectedQuote.text.replace(regex, WORD_PLACEHOLDER);
    const shuffledOptions = shuffleArray(selectedQuote.options);

    return res.json({
      id: selectedQuote._id.toString(),
      text: textWithPlaceholder,
      fullText: selectedQuote.text,
      author: selectedQuote.author,
      correctAnswer: selectedQuote.missingWord,
      options: shuffledOptions
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de citation: %s', error.message);
    return res.status(500).json({
      error: 'Impossible de récupérer une citation',
      details: error.message
    });
  }
});

// Health check pour Render (DB + app)
app.get('/health', (req, res) => {
  const dbOk = mongoose.connection.readyState === DB_CONNECTED_STATE;
  const statusCode = dbOk ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE;

  return res.status(statusCode).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected'
  });
});

// Cache pour les images de célébrités
const celebrityImageCache = new Map();

function getFromCache(key) {
  const entry = celebrityImageCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    celebrityImageCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlSeconds = CACHE_TTL_SECONDS) {
  celebrityImageCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * MS_PER_SECOND
  });
}

// Route pour obtenir l'image d'une célébrité depuis Wikipedia
app.get('/api/celebrity-image', async (req, res) => {
  const name = (req.query.name || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Paramètre "name" requis' });
  }

  const cacheKey = `celebrity:${name.toLowerCase()}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    logger.info('Image de %s récupérée du cache', name);
    return res.json(cached);
  }

  try {
    const params = {
      action: 'query',
      titles: name,
      prop: 'pageimages',
      format: 'json',
      pithumbsize: WIKI_THUMB_SIZE,
      redirects: WIKI_REDIRECT
    };

    const { data } = await axios.get(WIKI_API_URL, {
      params,
      headers: { 'User-Agent': WIKI_USER_AGENT }
    });
    const pages = data.query && data.query.pages;

    if (!pages) {
      return res.status(404).json({ error: 'Célébrité non trouvée' });
    }

    const page = Object.values(pages)[0];

    if (page && page.thumbnail && page.thumbnail.source) {
      const result = {
        image: page.thumbnail.source,
        title: page.title,
        source: 'Wikipedia'
      };
      setCache(cacheKey, result);
      logger.info('Image de %s récupérée depuis Wikipedia', page.title);
      return res.json(result);
    }

    return res.status(404).json({ error: 'Aucune image trouvée pour cette célébrité' });
  } catch (err) {
    logger.error('Erreur lors de la récupération de l\'image: %s', err.message);
    return res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'image' });
  }
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/', async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const authors = await Quote.distinct('author');

    return res.json({
      message: 'API Quizz est en ligne !',
      source: 'Citations drôles - Ouest-France',
      totalQuotes,
      authors,
      endpoints: ['/api/quote', '/api/celebrity-image?name=NomCelebrite']
    });
  } catch {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrer le serveur uniquement si exécuté directement (pas en test)
if (require.main === module) {
  app.listen(PORT, async () => {
    logger.info('Serveur démarré sur le port %d', PORT);
    try {
      await connectDB();
    } catch (err) {
      logger.error('Connexion MongoDB échouée: %s', err.message);
      process.exit(1);
    }
  });
}

module.exports = app;
