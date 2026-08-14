const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  submittedAt: { type: Date, default: Date.now },
  answers: { type: mongoose.Schema.Types.Mixed, required: true },
});

module.exports = mongoose.model('Survey', surveySchema);
