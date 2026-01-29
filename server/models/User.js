const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Google ID
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photo: { type: String },
  bestScore: { type: Number, default: 0 }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

module.exports = mongoose.model('User', userSchema);