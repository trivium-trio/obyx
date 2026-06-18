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
// Load environment variables FIRST — must be a side-effect import so it
// executes before any other modules try to read process.env.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import onrampRoutes from './routes/onramp.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { sequelize } from './models/index.js';

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
// ROUTES — All versioned under /api/v1/
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
app.use('/api/v1/user', userRoutes);

// On-ramp routes (fiat → crypto)
app.use('/api/v1/onramp', onrampRoutes);

// Webhook routes (Paystack callbacks — no auth, uses signature verification)
app.use('/api/v1/webhooks', webhookRoutes);

// ---------------------------------------------------------------------------
// DATABASE SYNC & SERVER START
// ---------------------------------------------------------------------------
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
      console.log(`   Health:  http://localhost:${PORT}/`);
      console.log(`   Routes:  /api/v1/user, /api/v1/onramp, /api/v1/webhooks`);
      console.log(`   Env:     ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();