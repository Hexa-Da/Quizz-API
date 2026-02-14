const request = require('supertest');

// Configuration des variables d'environnement pour les tests
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/quizz-api-test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.BACKEND_URL = 'http://localhost:3000';

// Mock de la connexion à la base de données
jest.mock('../config/database', () => jest.fn().mockResolvedValue(true));

// Mock du logger pour ne pas polluer les tests
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock des modèles Mongoose
const mockQuoteAggregate = jest.fn();
const mockQuoteCountDocuments = jest.fn();
const mockQuoteDistinct = jest.fn();

jest.mock('../models/Quote', () => {
  const mockModel = jest.fn();
  mockModel.aggregate = mockQuoteAggregate;
  mockModel.countDocuments = mockQuoteCountDocuments;
  mockModel.distinct = mockQuoteDistinct;
  return mockModel;
});

const mockUserFindOne = jest.fn();
jest.mock('../models/User', () => {
  const mockModel = jest.fn();
  mockModel.findOne = mockUserFindOne;
  return mockModel;
});

// Mock de mongoose.connection.readyState
jest.mock('mongoose', () => ({
  connection: { readyState: 1 },
  connect: jest.fn(),
  Schema: jest.fn().mockImplementation(() => ({})),
  model: jest.fn()
}));

const app = require('../index');

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('devrait retourner les informations de l\'API', async () => {
      mockQuoteCountDocuments.mockResolvedValue(20);
      mockQuoteDistinct.mockResolvedValue(['Coluche', 'Michel Audiard']);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('API Quizz est en ligne !');
      expect(res.body.totalQuotes).toBe(20);
      expect(res.body.authors).toEqual(['Coluche', 'Michel Audiard']);
      expect(res.body.endpoints).toBeDefined();
    });

    it('devrait retourner 500 en cas d\'erreur', async () => {
      mockQuoteCountDocuments.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Erreur serveur');
    });
  });

  describe('GET /health', () => {
    it('devrait retourner ok quand la DB est connectée', async () => {
      const mongoose = require('mongoose');
      mongoose.connection.readyState = 1;

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.db).toBe('connected');
    });

    it('devrait retourner degraded quand la DB est déconnectée', async () => {
      const mongoose = require('mongoose');
      mongoose.connection.readyState = 0;

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.db).toBe('disconnected');

      // Restaurer l'état
      mongoose.connection.readyState = 1;
    });
  });

  describe('GET /auth/logout', () => {
    it('devrait retourner un message de déconnexion', async () => {
      const res = await request(app).get('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Déconnexion réussie');
    });
  });

  describe('GET /api/quote', () => {
    it('devrait retourner une citation avec des options', async () => {
      mockQuoteAggregate.mockResolvedValue([{
        _id: { toString: () => 'abc123' },
        text: 'Ceci est une citation drôle.',
        author: 'Coluche',
        missingWord: 'drôle',
        options: ['drôle', 'bizarre', 'étrange', 'curieux']
      }]);

      const res = await request(app).get('/api/quote');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('abc123');
      expect(res.body.text).toContain('_____');
      expect(res.body.author).toBe('Coluche');
      expect(res.body.correctAnswer).toBe('drôle');
      expect(res.body.options).toHaveLength(4);
    });

    it('devrait retourner 404 si aucune citation disponible', async () => {
      mockQuoteAggregate.mockResolvedValue([]);

      const res = await request(app).get('/api/quote');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Aucune citation disponible');
    });

    it('devrait retourner 500 en cas d\'erreur', async () => {
      mockQuoteAggregate.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/quote');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Impossible de récupérer une citation');
    });
  });

  describe('GET /api/user', () => {
    it('devrait retourner 401 sans token', async () => {
      const res = await request(app).get('/api/user');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Accès refusé');
    });

    it('devrait retourner 403 avec un token invalide', async () => {
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Token invalide');
    });
  });

  describe('POST /api/score', () => {
    it('devrait retourner 401 sans token', async () => {
      const res = await request(app)
        .post('/api/score')
        .send({ score: 5 });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Accès refusé');
    });
  });

  describe('GET /api/celebrity-image', () => {
    it('devrait retourner 400 sans paramètre name', async () => {
      const res = await request(app).get('/api/celebrity-image');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Paramètre "name" requis');
    });

    it('devrait retourner 400 avec un name vide', async () => {
      const res = await request(app).get('/api/celebrity-image?name=');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Paramètre "name" requis');
    });
  });
});
