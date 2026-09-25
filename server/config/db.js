/**
 * server/config/db.js
 * MongoDB connection — deployment-agnostic.
 * Set MONGODB_URI in .env (Docker, Atlas, or on-prem replica set).
 * See DEPLOYMENT.md for connection string examples for each target.
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideahub';
    const conn = await mongoose.connect(mongoURI, {
      // Mongoose 7+ handles poolSize via server selection timeout config
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed on SIGINT');
  process.exit(0);
});

module.exports = connectDB;
