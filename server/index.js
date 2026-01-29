const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
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

// Citations drôles (source: citations.ouest-france.fr)
const funnyQuotes = [
    {
      id: 1,
      text: "C'est drôle comme les gens qui se croient instruits éprouvent le besoin de faire chier le monde.",
      author: "Boris Vian",
      missingWord: "drôle",
      options: ["drôle", "étrange", "bizarre", "curieux"]
    },
    {
      id: 2,
      text: "Quand j'étais petit à la maison, le plus dur c'était la fin du mois... Surtout les trente derniers jours !",
      author: "Coluche",
      missingWord: "dur",
      options: ["dur", "difficile", "pénible", "compliqué"]
    },
    {
      id: 3,
      text: "C'est pas parce qu'on a rien à dire qu'il faut fermer sa gueule.",
      author: "Michel Audiard",
      missingWord: "fermer",
      options: ["fermer", "garder", "serrer", "boucher"]
    },
    {
      id: 4,
      text: "Il faut cueillir les cerises avec la queue. J'avais déjà du mal avec la main !",
      author: "Coluche",
      missingWord: "cueillir",
      options: ["cueillir", "ramasser", "prendre", "attraper"]
    },
    {
      id: 5,
      text: "Quand on mettra les cons sur orbite, t'as pas fini de tourner.",
      author: "Michel Audiard",
      missingWord: "orbite",
      options: ["orbite", "espace", "ciel", "lune"]
    },
    {
      id: 6,
      text: "Pourquoi essayer de faire semblant d'avoir l'air de travailler ? C'est de la fatigue inutile !",
      author: "Pierre Dac",
      missingWord: "fatigue",
      options: ["fatigue", "perte", "gaspillage", "effort"]
    },
    {
      id: 7,
      text: "Socrate disait: \"Je sais que je ne sais rien\", donc chacun de nous en sait plus que Socrate, puisque nous savons au moins que Socrate ne savait rien.",
      author: "Jean Amadou",
      missingWord: "sait",
      options: ["sait", "connaît", "apprend", "comprend"]
    },
    {
      id: 8,
      text: "Boire du café empêche de dormir. Par contre, dormir empêche de boire du café.",
      author: "Philippe Geluck",
      missingWord: "empêche",
      options: ["empêche", "interdit", "bloque", "arrête"]
    },
    {
      id: 9,
      text: "Si le ridicule se mettait à tuer, les problèmes démographiques seraient vite réglés.",
      author: "Gaëtan Faucer",
      missingWord: "ridicule",
      options: ["ridicule", "bêtise", "folie", "absurdité"]
    },
    {
      id: 10,
      text: "Un pigeon, c'est plus con qu'un dauphin, d'accord... mais ça vole.",
      author: "Michel Audiard",
      missingWord: "vole",
      options: ["vole", "plane", "s'envole", "décolle"]
    },
    {
      id: 11,
      text: "Le meilleur argument contre la démocratie est un entretien de cinq minutes avec un électeur moyen.",
      author: "Winston Churchill",
      missingWord: "démocratie",
      options: ["démocratie", "république", "politique", "gouvernement"]
    },
    {
      id: 12,
      text: "Une star, c'est quelqu'un qui travaille dur pour être connu et qui, ensuite, porte des lunettes noires pour qu'on ne le reconnaisse pas.",
      author: "Fred Allen",
      missingWord: "connu",
      options: ["connu", "célèbre", "fameux", "réputé"]
    },
    {
      id: 13,
      text: "Le premier homme qui est mort a dû être drôlement surpris.",
      author: "Georges Wolinski",
      missingWord: "surpris",
      options: ["surpris", "étonné", "choqué", "stupéfait"]
    },
    {
      id: 14,
      text: "Ça m'en touche une sans faire bouger l'autre",
      author: "Jacques Chirac",
      missingWord: "touche",
      options: ["touche", "atteint", "affecte", "intéresse"]
    },
    {
      id: 15,
      text: "Les femmes viennent de Venus. Les hommes mangent des Mars.",
      author: "MC Solaar",
      missingWord: "mangent",
      options: ["mangent", "consomment", "dévorent", "avalent"]
    },
    {
      id: 16,
      text: "Faut se méfier de la connerie, les gens s'en emparent facilement.",
      author: "Gaëtan Faucer",
      missingWord: "connerie",
      options: ["connerie", "bêtise", "folie", "absurdité"]
    },
    {
      id: 17,
      text: "Souffrant d'insomnie, j'échangerais un matelas de plumes contre un sommeil de plomb.",
      author: "Pierre Dac",
      missingWord: "sommeil",
      options: ["sommeil", "repos", "dodo", "sieste"]
    },
    {
      id: 18,
      text: "Si l'herbe est plus verte dans le jardin de ton voisin, laisse-le s'emmerder à la tondre.",
      author: "Fred Allen",
      missingWord: "verte",
      options: ["verte", "belle", "haute", "fraîche"]
    },
    {
      id: 19,
      text: "On dit que le ridicule tue. Est-ce vrai ? Pas du tout! Regardez autour de vous, il n'y a que des gens bien portants.",
      author: "Raymond Devos",
      missingWord: "ridicule",
      options: ["ridicule", "bêtise", "folie", "absurdité"]
    },
    {
      id: 20,
      text: "Je me suis marié deux fois: deux catastrophes. Ma première femme est partie, la deuxième est restée.",
      author: "Francis Blanche",
      missingWord: "catastrophes",
      options: ["catastrophes", "désastres", "échecs", "drames"]
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

// Route pour obtenir une citation drôle
app.get('/api/quote', (req, res) => {
    try {
      // Sélectionner une citation aléatoire
      const randomIndex = Math.floor(Math.random() * funnyQuotes.length);
      const selectedQuote = funnyQuotes[randomIndex];
      
      // Créer le texte avec placeholder
      const regex = new RegExp(`\\b${selectedQuote.missingWord}\\b`, 'gi');
      const textWithPlaceholder = selectedQuote.text.replace(regex, '_____');
      
      // Mélanger les options
      const shuffledOptions = shuffleArray(selectedQuote.options);
      
      // Retourner la citation avec placeholder et options mélangées
      res.json({
        id: selectedQuote.id,
        text: textWithPlaceholder,
        fullText: selectedQuote.text,
        author: selectedQuote.author,
        correctAnswer: selectedQuote.missingWord,
        options: shuffledOptions
      });
      
      console.log(`✅ Citation ${selectedQuote.id} de ${selectedQuote.author} envoyée`);
      
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
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Quizz est en ligne !',
        source: 'Citations drôles - Ouest-France',
        totalQuotes: funnyQuotes.length,
        authors: [...new Set(funnyQuotes.map(q => q.author))],
        endpoint: '/api/quote'
    });
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
