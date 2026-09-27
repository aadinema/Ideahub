/**
 * server/server.js
 * Express application entry point.
 *
 * Security baseline: helmet, cors, rate-limit, mongo-sanitize
 * All routes mounted here; errorHandler is last middleware.
 *
 * Master Prompt §2 (Tech Stack), §9 (NFR)
 */
require('dotenv').config();

// ---------------------------------------------------------------------------
// Validate storage configuration BEFORE loading routes
// (Routes import upload middleware which requires S3 packages if S3 enabled)
// ---------------------------------------------------------------------------
if (process.env.STORAGE_PROVIDER === 's3') {
  const requiredS3Vars = ['S3_REGION', 'S3_BUCKET'];
  const missingVars = requiredS3Vars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    throw new Error(
      `S3 storage is enabled (STORAGE_PROVIDER=s3) but required environment variables are missing: ${missingVars.join(', ')}. ` +
      'Set these variables or switch to STORAGE_PROVIDER=local for development.'
    );
  }

  // Verify multer-s3 package is available
  try {
    require.resolve('multer-s3');
  } catch {
    throw new Error(
      'S3 storage is enabled but multer-s3 package is not installed. ' +
      'Install it with: npm install multer-s3 @aws-sdk/client-s3 @aws-sdk/lib-storage'
    );
  }
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const { protect } = require('./middleware/auth');

// Route modules
const authRoutes      = require('./routes/authRoutes');
const ideaRoutes      = require('./routes/ideaRoutes');       // Phase 1
const dashboardRoutes = require('./routes/dashboardRoutes');  // Phase 1
const supervisorRoutes = require('./routes/supervisorRoutes'); // Phase 2
const evaluationRoutes = require('./routes/evaluationRoutes'); // Phase 2
const committeeRoutes  = require('./routes/committeeRoutes'); // Phase 2
const eventRoutes = require('./routes/eventRoutes'); // Phase 3
const galleryRoutes = require('./routes/galleryRoutes'); // Phase 4
const implementationRoutes = require('./routes/implementationRoutes'); // Phase 5
const benefitRoutes = require('./routes/benefitRoutes'); // Phase 5
const reportRoutes = require('./routes/reportRoutes'); // Phase 6
const adminRoutes = require('./routes/adminRoutes'); // Phase 6
const notificationRoutes = require('./routes/notificationRoutes'); // Phase 6

const sanitize = require('./middleware/sanitize');
const securityHeaders = require('./middleware/securityHeaders');

// ---------------------------------------------------------------------------
// Connect to MongoDB
// ---------------------------------------------------------------------------
connectDB();

// Log storage provider being used
if (process.env.STORAGE_PROVIDER === 's3') {
  logger.info('Storage: S3 enabled', {
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
  });
} else {
  logger.info('Storage: Local disk enabled', {
    directory: process.env.LOCAL_UPLOAD_DIR || './uploads',
  });
}

// ---------------------------------------------------------------------------
// Background Jobs
// ---------------------------------------------------------------------------
const slaBreachCheck = require('./jobs/slaBreachCheck');
slaBreachCheck.startJob();

const eventAutoClose = require('./jobs/eventAutoClose');
eventAutoClose.startJob();

const galleryAutoPublish = require('./jobs/galleryAutoPublish');
galleryAutoPublish.startJob();

const implementationReminder = require('./jobs/implementationReminder');
implementationReminder.startJob();

const app = express();

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Observability: Request ID & Logging
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - Started`, { requestId: req.id });
  next();
});

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------

// Helmet: sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// Additional security headers (CSP, X-Content-Type-Options, etc.)
app.use(securityHeaders);

// CORS: allow only the frontend origin — FAIL CLOSED in production
// If CLIENT_ORIGIN is not set in production, CORS will reject all cross-origin requests
const clientOrigin = process.env.CLIENT_ORIGIN;
if (!clientOrigin && process.env.NODE_ENV === 'production') {
  throw new Error(
    'CLIENT_ORIGIN environment variable is required in production. ' +
    'Without it, CORS will reject all cross-origin requests. ' +
    'Set CLIENT_ORIGIN to the frontend URL (e.g., https://ideahub.company.com)'
  );
}

app.use(
  cors({
    origin: clientOrigin || 'http://localhost:5173', // default to localhost for development only
    credentials: true, // required for httpOnly cookie on refresh endpoint
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — global API limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,                  // 500 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Tighter limit on auth routes (login brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing (for refresh token httpOnly cookie)
app.use(cookieParser());

// NoSQL-injection sanitization (Express-5-safe; strips $/dotted keys from body & params)
app.use(sanitize);

// ---------------------------------------------------------------------------
// Health check (public — no auth)
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/readiness', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'unavailable', dbState: mongoose.connection.readyState });
  }
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth',      authRoutes);
app.use('/api/ideas',     ideaRoutes);      // Phase 1 — RBAC enforced in middleware/controller
app.use('/api/dashboard', dashboardRoutes); // Phase 1
app.use('/api/supervisor', protect, supervisorRoutes); // Phase 2
app.use('/api/evaluations', protect, evaluationRoutes); // Phase 2
app.use('/api/committee', protect, committeeRoutes); // Phase 2
app.use('/api/events', protect, eventRoutes); // Phase 3
app.use('/api/gallery', protect, galleryRoutes); // Phase 4
app.use('/api/implementations', protect, implementationRoutes); // Phase 5
app.use('/api/benefits', protect, benefitRoutes); // Phase 5
app.use('/api/reports', protect, reportRoutes); // Phase 6
app.use('/api/admin', protect, adminRoutes); // Phase 6
app.use('/api/notifications', protect, notificationRoutes); // Phase 6

// Serve static uploads (if local storage)
if (process.env.STORAGE_PROVIDER !== 's3') {
  const path = require('path');
  const uploadDir = process.env.LOCAL_UPLOAD_DIR
    ? path.resolve(process.env.LOCAL_UPLOAD_DIR)
    : path.join(__dirname, '../uploads');
  app.use('/uploads', protect, express.static(uploadDir));
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// ---------------------------------------------------------------------------
// Error handling (MUST be last middleware)
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------
// Startup check: PORT must be a valid TCP port; fail fast rather than listen on NaN.
const rawPort = process.env.PORT || 5000;
const PORT = Number.parseInt(rawPort, 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  logger.error(`Invalid PORT "${rawPort}" — expected an integer between 1 and 65535.`);
  process.exit(1);
}
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
    } catch (err) {
      logger.error('Error closing MongoDB connection', { error: err.message });
    }
    process.exit(0);
  });
});

module.exports = app;
