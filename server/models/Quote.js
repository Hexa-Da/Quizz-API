const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  missingWord: { type: String, required: true },
  options: { type: [String], required: true }  // tableau de 4 chaînes
}, {
  timestamps: true
});

module.exports = mongoose.model('Quote', quoteSchema);