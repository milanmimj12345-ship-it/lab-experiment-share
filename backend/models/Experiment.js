const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  group: { type: String, enum: ['A', 'B'], required: true },
  lab: { type: String, enum: ['DBMS', 'OS'], required: true },
  isRandom: { type: Boolean, default: false },
  experimentNumber: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Experiment', experimentSchema);
