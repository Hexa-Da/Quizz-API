const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const Quote = require('./models/Quote');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Indiquer que l’app est derrière un proxy (Render)
app.set('trust proxy', 1);

// Middleware
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

app.use(cors({
    origin: FRONTEND_URL, // URL de votre frontend (configurable via .env)
    credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

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
            // Utilisateur existe déjà, mettre à jour les infos si nécessaire
            user.email = profile.emails[0].value;
            user.name = profile.displayName;
            user.photo = profile.photos[0].value;
            await user.save();
        } else {
            // Créer un nouvel utilisateur
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

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ id: id });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
});

// Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Accès refusé' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    try {
      const user = await User.findOne({ id: decoded.id });
      if (!user) return res.status(403).json({ error: 'Utilisateur introuvable' });
      req.user = user;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  });
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
      id: user.id,
      email: user.email
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.redirect(`${FRONTEND_URL}/?token=${encodeURIComponent(token)}`);
  }
);

app.get('/auth/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

// Route pour obtenir l'utilisateur actuel
app.get('/api/user', verifyToken, (req, res) => {
  res.json(req.user);
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
    console.error('Erreur lors de la mise à jour du score:', error.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du score' });
  }
});

// Fonction pour mélanger un tableau
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
    const results = await Quote.aggregate([{ $sample: { size: 1 } }]);
    const selectedQuote = results[0];

    if (!selectedQuote) {
      return res.status(404).json({ error: 'Aucune citation disponible' });
    }

    const regex = new RegExp(`\\b${selectedQuote.missingWord}\\b`, 'gi');
    const textWithPlaceholder = selectedQuote.text.replace(regex, '_____');
    const shuffledOptions = shuffleArray(selectedQuote.options);

    res.json({
      id: selectedQuote._id.toString(),
      text: textWithPlaceholder,
      fullText: selectedQuote.text,
      author: selectedQuote.author,
      correctAnswer: selectedQuote.missingWord,
      options: shuffledOptions
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    res.status(500).json({
      error: 'Impossible de récupérer une citation',
      details: error.message
    });
  }
});

// Health check pour Render (DB + app)
app.get('/health', (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected'
  });
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/', async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const authors = await Quote.distinct('author');
    res.json({
      message: 'API Quizz est en ligne !',
      source: 'Citations drôles - Ouest-France',
      totalQuotes,
      authors,
      endpoint: '/api/quote'
    });
  } catch (e) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Démarrer le serveur tout de suite (évite le timeout du health check Render),
// puis connecter la DB en arrière-plan. /health renverra 503 jusqu'à connexion DB.
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  connectDB().catch((err) => {
    console.error('❌ Connexion MongoDB échouée:', err.message);
    process.exit(1);
  });
});
