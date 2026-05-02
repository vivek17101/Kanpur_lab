const Admin = require('../models/Admin');
const Counter = require('../models/Counter');
const Sample = require('../models/Sample');
const Supplier = require('../models/Supplier');
const { createToken, hashPassword, verifyPassword } = require('../utils/auth');

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set');
  }
  const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });

  if (existingAdmin) {
    return existingAdmin;
  }

  return Admin.create({
    username: username.toLowerCase(),
    passwordHash: hashPassword(password),
  });
}

async function replaceCollection(Model, docs) {
  await Model.deleteMany({});

  if (!Array.isArray(docs) || docs.length === 0) {
    return;
  }

  await Model.insertMany(docs);
}

exports.login = async (req, res, next) => {
  try {
    await ensureDefaultAdmin();

    const username = String(req.body.username || '')
      .toLowerCase()
      .trim();
    const password = String(req.body.password || '').trim();
    const admin = await Admin.findOne({ username });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      token: createToken(admin),
      admin: {
        username: admin.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.me = (req, res) => {
  res.json({ admin: { username: req.admin.username } });
};

exports.changePassword = async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '').trim();
    const newPassword = String(req.body.newPassword || '').trim();
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    const adminId = req.admin._id || req.admin.id;
    const admin = await Admin.findById(adminId);
    if (!admin || !verifyPassword(currentPassword, admin.passwordHash)) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    admin.passwordHash = hashPassword(newPassword);
    await admin.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.backupDatabase = async (req, res, next) => {
  try {
    const [samples, suppliers, counters] = await Promise.all([
      Sample.find({}).sort({ createdAt: -1 }).lean(),
      Supplier.find({}).sort({ name: 1 }).lean(),
      Counter.find({}).sort({ key: 1 }).lean(),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      app: 'Kanpur Laboratory',
      version: 1,
      exportedBy: req.admin.username,
      database: 'kanpur_lab',
      counts: {
        samples: samples.length,
        suppliers: suppliers.length,
        counters: counters.length,
      },
      data: {
        samples,
        suppliers,
        counters,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreDatabase = async (req, res, next) => {
  try {
    const backup = req.body;
    const backupData = backup?.data || {};
    const samples = Array.isArray(backupData.samples) ? backupData.samples : null;
    const suppliers = Array.isArray(backupData.suppliers) ? backupData.suppliers : null;
    const counters = Array.isArray(backupData.counters) ? backupData.counters : null;

    if (!samples || !suppliers || !counters) {
      return res.status(400).json({
        message: 'Invalid backup file. Expected samples, suppliers, and counters arrays.',
      });
    }

    await Promise.all([
      replaceCollection(Sample, samples),
      replaceCollection(Supplier, suppliers),
      replaceCollection(Counter, counters),
    ]);

    res.json({
      message: 'Database restored successfully.',
      restoredAt: new Date().toISOString(),
      restoredBy: req.admin.username,
      counts: {
        samples: samples.length,
        suppliers: suppliers.length,
        counters: counters.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
