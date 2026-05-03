const express = require('express');
const {
  createSample,
  deleteSample,
  getSampleById,
  getSampleStats,
  getSamples,
  updateSample,
} = require('../controllers/sampleController');
const requireAdmin = require('../middleware/authMiddleware');

const router = express.Router();

// All sample routes require authentication.
// Without this, any machine on the same network (or the open internet in
// Docker deployments) can read, create, edit, or delete lab records.
router.route('/').get(requireAdmin, getSamples).post(requireAdmin, createSample);
router.get('/stats/summary', requireAdmin, getSampleStats);
router
  .route('/:id')
  .get(requireAdmin, getSampleById)
  .put(requireAdmin, updateSample)
  .delete(requireAdmin, deleteSample);

module.exports = router;
