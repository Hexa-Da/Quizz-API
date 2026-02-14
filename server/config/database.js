const mongoose = require('mongoose');
const logger = require('./logger');
require('dotenv').config();

const DEFAULT_DB_URI = 'mongodb://localhost:27017/quizz-api';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || DEFAULT_DB_URI);
    logger.info('MongoDB connecté avec succès');
  } catch (error) {
    logger.error('Erreur de connexion MongoDB: %s', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
