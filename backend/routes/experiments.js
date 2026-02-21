const express = require('express');
const router = express.Router();
const Experiment = require('../models/Experiment');

// GET all experiments (no auth needed)
router.get('/', async (req, res) => {
  try {
    const { group, lab, isRandom } = req.query;
    const filter = {};
    if (group) filter.group = group.toUpperCase();
    if (lab) filter.lab = lab.toUpperCase();
    if (isRandom !== undefined) filter.isRandom = isRandom === 'true';
    const experiments = await Experiment.find(filter).sort({ experimentNumber: 1, createdAt: 1 });
    res.json({ success: true, experiments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST - create experiment (no auth needed)
router.post('/', async (req, res) => {
  const { title, group, lab, isRandom } = req.body;
  if (!title || !group || !lab) {
    return res.status(400).json({ success: false, message: 'title, group, and lab are required' });
  }
  try {
    let experimentNumber;
    if (!isRandom) {
      const count = await Experiment.countDocuments({ group: group.toUpperCase(), lab: lab.toUpperCase(), isRandom: false });
      experimentNumber = count + 1;
    }
    const experiment = await Experiment.create({
      title, group: group.toUpperCase(), lab: lab.toUpperCase(),
      isRandom: isRandom || false, experimentNumber
    });
    res.status(201).json({ success: true, experiment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE experiment (no auth needed)
router.delete('/:id', async (req, res) => {
  try {
    const File = require('../models/File');
    await File.deleteMany({ experiment: req.params.id });
    await Experiment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
