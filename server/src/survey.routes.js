const express = require('express');
const router = express.Router();
const Survey = require('./survey.model');
const authMiddleware = require('./auth.middleware');
const { readLimiter, writeLimiter } = require('./limiter');

// Public: save a survey submission.
router.post('/', writeLimiter, async (req, res) => {
  try {
    const survey = new Survey({ answers: req.body });
    await survey.save();
    res.status(201).json({ success: true, id: survey._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public: aggregated numbers for the shared administration page.
router.get('/stats', readLimiter, async (req, res) => {
  try {
    const total = await Survey.countDocuments();
    const all = await Survey.find({}, {
      'answers.results.overallScore': 1,
      'answers.rawAnswers.d_branch': 1,
      submittedAt: 1,
    });

    const scores = all
      .map((survey) => survey.answers?.results?.overallScore)
      .filter((score) => typeof score === 'number');

    const branches = [...new Set(
      all.map((survey) => survey.answers?.rawAnswers?.d_branch).filter(Boolean),
    )].sort();

    res.json({
      total,
      avgScore: scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null,
      minScore: scores.length ? Math.min(...scores) : null,
      maxScore: scores.length ? Math.max(...scores) : null,
      earliest: all.length ? all[0].submittedAt : null,
      latest: all.length ? all[all.length - 1].submittedAt : null,
      branches,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public: paginated and filtered list for the shared administration page.
router.get('/', readLimiter, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
    const scoreMin = req.query.scoreMin ? parseFloat(req.query.scoreMin) : null;
    const scoreMax = req.query.scoreMax ? parseFloat(req.query.scoreMax) : null;
    const branch = req.query.branch || null;
    const filter = {};

    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom) filter.submittedAt.$gte = dateFrom;
      if (dateTo) filter.submittedAt.$lte = dateTo;
    }

    if (scoreMin !== null || scoreMax !== null) {
      filter['answers.results.overallScore'] = {};
      if (scoreMin !== null) filter['answers.results.overallScore'].$gte = scoreMin;
      if (scoreMax !== null) filter['answers.results.overallScore'].$lte = scoreMax;
    }

    if (branch) {
      filter['answers.rawAnswers.d_branch'] = branch;
    }

    const total = await Survey.countDocuments(filter);
    const surveys = await Survey.find(filter)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: surveys,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public: load a single result page.
router.get('/:id', readLimiter, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json(survey);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Maintenance only: the API key is kept exclusively on the server and is not
// embedded in the public frontend bundle.
router.delete('/:id', authMiddleware, writeLimiter, async (req, res) => {
  try {
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
