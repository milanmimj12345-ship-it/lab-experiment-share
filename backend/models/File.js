const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  experiment: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  group: { type: String, enum: ['A', 'B'], required: true },
  lab: { type: String, enum: ['DBMS', 'OS'], required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  uploaderIp: { type: String, default: 'unknown' },
  deviceId: { type: String, default: 'unknown' }, // browser-generated stable ID — used for grouping
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
