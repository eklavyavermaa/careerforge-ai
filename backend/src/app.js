const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const analysisRoutes = require('./routes/analysis.routes');
const coverLetterRoutes = require('./routes/coverLetter.routes');
const interviewRoutes = require('./routes/interview.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const applicationRoutes = require('./routes/application.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

app.set('trust proxy', 1); // needed for correct req.ip / rate-limiting behind Render's proxy

// --- Security middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . operators from user input (NoSQL injection)
app.use(xss()); // sanitizes user input from malicious HTML/JS

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiter (per-route stricter limits are applied separately, e.g. auth routes)
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// --- Health check ---
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CareerForge AI API is running.' });
});

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/cover-letters', coverLetterRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/roadmaps', roadmapRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/settings', settingsRoutes);

// --- 404 handler ---
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// --- Centralized error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
