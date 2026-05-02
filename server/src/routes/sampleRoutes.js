const express = require('express');
const {
  createSample,
  deleteSample,
  getSampleById,
  getSampleStats,
  getSamples,
  updateSample,
} = require('../controllers/sampleController');

const router = express.Router();

router.route('/').get(getSamples).post(createSample);
router.get('/stats/summary', getSampleStats);
router.route('/:id').get(getSampleById).put(updateSample).delete(deleteSample);

module.exports = router;
