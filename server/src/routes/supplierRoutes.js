const express = require('express');
const {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} = require('../controllers/supplierController');
const requireAdmin = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(requireAdmin, getSuppliers).post(requireAdmin, createSupplier);
router.route('/:id').put(requireAdmin, updateSupplier).delete(requireAdmin, deleteSupplier);

module.exports = router;
