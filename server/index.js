require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection caching for Serverless & Local development
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager';
  await mongoose.connect(uri);
  isConnected = true;
};

// Ensure DB is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Mongo connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/tasks', require('./routes/tasks'));

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'TaskBoard API running', status: 'ok' });
});

// Central error handler: validation -> 400, bad id -> 400, everything else -> 500
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id or value' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

// Listen only when run directly (local development), not when imported by Vercel serverless
if (require.main === module || !process.env.VERCEL) {
  connectDB()
    .then(() => console.log('DB Connected'))
    .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
    .catch((e) => { console.error('Mongo connection failed:', e.message); process.exit(1); });
}

module.exports = app;
