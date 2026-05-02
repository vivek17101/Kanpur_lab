const express = require('express');
const {
  backupDatabase,
  changePassword,
  login,
  me,
  restoreDatabase,
} = require('../controllers/authController');
const requireAdmin = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAdmin, me);
router.post('/change-password', requireAdmin, changePassword);
router.get('/backup', requireAdmin, backupDatabase);
router.post('/restore', requireAdmin, restoreDatabase);

module.exports = router;
