require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[Server] CareerForge AI API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => console.log('Process terminated.'));
  });
});
