const cors = require('cors');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const sampleRoutes = require('./routes/sampleRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

const app = express();

const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === 'null' || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/samples', sampleRoutes);
app.use('/suppliers', supplierRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'value';
    const labels = {
      key: 'counter key',
      name: 'supplier name',
      reportNumber: 'report number',
      username: 'username',
    };

    return res.status(409).json({
      message: `This ${labels[field] || field} already exists. Please use a different value or edit the existing record.`,
    });
  }

  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({
    message: error.message || 'Server error',
  });
});

module.exports = app;
