// OBYX API SERVER — Entry Point
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import config from './config/env.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';


// Import routes
import userRoutes from './routes/user.routes.js';
import onrampRoutes from './routes/onramp.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import paystackRoutes from './routes/paystack.routes.js';
import offrampRoutes from './routes/offramp.routes.js';
import transferRoutes from './routes/transfer.routes.js';

// Import database
import { sequelize } from './models/index.js';

const app = express();

// Support multiple comma-separated URLs in FRONTEND_URL
const allowedOrigins = config.FRONTEND_URL.split(',').map(url => url.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// JSON body parser for all routes (attaches raw body for webhooks)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.get('/ping', (req, res) => res.status(200).send('pong'));
app.get('/', (req, res) => {
  res.json({
    service: 'Obyx API',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api/v1/user', userRoutes);

app.use('/api/v1/onramp', onrampRoutes);
app.use('/api/v1/offramp', offrampRoutes);

app.use('/api/v1/paystack', paystackRoutes);

app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/transfer', transferRoutes);
const PORT = config.PORT;

import { startPayoutWorker } from './workers/payout.worker.js';
import { startReconciliationCron } from './workers/reconciliation.cron.js';

const startServer = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log(' Database connection established successfully.');

    // Sync models with the database
    // WARNING: Use { alter: true } in development only. In production,
    // use migrations (npx sequelize-cli db:migrate).
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    // Start background workers
    startPayoutWorker();
    startReconciliationCron();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n OBYX API is cooking on port ${PORT}`);

      // Self-ping interval every 14 minutes (14 * 60 * 1000 ms) to keep Render server awake
      const pingIntervalMs = 14 * 60 * 1000;
      setInterval(() => {
        const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || `http://localhost:${PORT}`;
        fetch(`${targetUrl}/ping`)
          .then((res) => console.log(`[KEEPALIVE] Self-pinged ${targetUrl}/ping -> Status: ${res.status}`))
          .catch((err) => console.error(`[KEEPALIVE] Self-ping failed:`, err.message));
      }, pingIntervalMs);
    });
  } catch (err) {
    console.error(' Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
