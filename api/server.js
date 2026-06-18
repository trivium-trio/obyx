// =============================================================================
// OBYX API SERVER — Entry Point
// Express.js orchestrator for the on-ramp/off-ramp platform.
//
// Architecture:
//   server.js (this file)  →  Wires middleware, routes, and DB
//   middleware/             →  Auth (Supabase JWT), Webhook verification
//   routes/                →  User, OnRamp, Webhooks
//   services/              →  Circle (Friend 1), Paystack (Friend 2) — mocked
//   models/                →  Sequelize models (User, Transaction)
//   config/                →  Database connection with SSL
// =============================================================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables BEFORE anything else
dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// GLOBAL MIDDLEWARE
// ---------------------------------------------------------------------------

// CORS — allow the Next.js frontend to call our API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// JSON body parser for all routes
app.use(express.json());

// ---------------------------------------------------------------------------
// ROUTE IMPORTS
// ---------------------------------------------------------------------------
const userRoutes = require('./routes/user.routes');
const onrampRoutes = require('./routes/onramp.routes');
const webhookRoutes = require('./routes/webhook.routes');

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'Obyx API',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// User routes (wallet linking, profile)
app.use('/api/user', userRoutes);

// On-ramp routes (fiat → crypto)
app.use('/api/onramp', onrampRoutes);

// Webhook routes (Paystack callbacks — no auth, uses signature verification)
app.use('/api/webhooks', webhookRoutes);

// ---------------------------------------------------------------------------
// DATABASE SYNC & SERVER START
// ---------------------------------------------------------------------------
const { sequelize } = require('./models');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models with the database
    // WARNING: Use { alter: true } in development only. In production,
    // use migrations (npx sequelize-cli db:migrate).
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 OBYX API is cooking on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/`);
      console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();