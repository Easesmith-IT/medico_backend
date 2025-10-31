
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const routes = require('./route');
const AppError = require('./utils/appError');

const app = express();

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Medico API',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Mount all API routes
app.use('/api/v1', routes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env file');
  process.exit(1);
}

const DB = process.env.MONGODB_URI;

console.log('');
console.log('='.repeat(70));
console.log('INITIALIZING APPLICATION');
console.log('='.repeat(70));
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT || 5000}`);
console.log(`MongoDB: Connecting to Atlas cluster...`);
console.log(`Database: medico`);
console.log('');

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('SUCCESS: MongoDB Atlas connected successfully');
    console.log('');
    console.log('COMPASS CONNECTION');
    console.log('-'.repeat(70));
    console.log('To view data in MongoDB Compass:');
    console.log('1. Open MongoDB Compass application');
    console.log('2. Use connection string from .env MONGODB_COMPASS');
    console.log('3. Database: medico');
    console.log('-'.repeat(70));
    console.log('');
  })
  .catch((err) => {
    console.error('');
    console.error('ERROR: Database connection failed');
    console.error('='.repeat(70));
    console.error('Message:', err.message);
    console.error('='.repeat(70));
    console.error('');
    console.error('TROUBLESHOOTING:');
    console.error('1. Check MONGODB_URI in .env file');
    console.error('2. Verify username and password are correct');
    console.error('3. Check if IP address is whitelisted in Atlas');
    console.error('4. Verify internet connection');
    console.error('');
    process.exit(1);
  });

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(70));
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/v1`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(70));
  console.log('');
});

// ============================================
// ERROR HANDLING
// ============================================

process.on('unhandledRejection', (err) => {
  console.log('');
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error('='.repeat(70));
  console.error('Error:', err.name);
  console.error('Message:', err.message);
  console.error('='.repeat(70));
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('');
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error('='.repeat(70));
  console.error('Error:', err.name);
  console.error('Message:', err.message);
  console.error('='.repeat(70));
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;





















// const express = require('express');
// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const routes = require('./route');
// const AppError = require('./utils/appError');

// const app = express();

// // CORS Configuration
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   credentials: true
// }));

// // Body parser
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Cookie parser
// app.use(cookieParser());

// // Root route
// app.get('/', (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Welcome to Capsico API',
//     endpoints: {
//       health: '/health',
//       api: '/api/v1'
//     }
//   });
// });

// // Health Check
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Server is running'
//   });
// });

// // Mount all API routes
// app.use('/api/v1', routes);

// // Handle undefined routes
// app.use((req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

// // Global Error Handler
// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // Database Connection
// if (!process.env.MONGODB_URI) {
//   console.error('MONGODB_URI not found in config.env');
//   process.exit(1);
// }

// const DB = process.env.MONGODB_URI;

// mongoose
//   .connect(DB, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
//   .then(() => console.log('Database connected successfully'))
//   .catch((err) => {
//     console.log('Database connection error:', err);
//     process.exit(1);
//   });

// // Start Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// // Handle unhandled rejections
// process.on('unhandledRejection', (err) => {
//   console.log('UNHANDLED REJECTION!  Shutting down...');
//   console.log(err.name, err.message);
//   process.exit(1);
// });







