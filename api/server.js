// OBYX API SERVER — Entry Point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables 
dotenv.config();

// Import routes
import userRoutes from './routes/user.routes.js';
import onrampRoutes from './routes/onramp.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import paystackRoutes from './routes/paystack.routes.js';

// Import database
import { sequelize } from './models/index.js';

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// JSON body parser for all routes
app.use(express.json());
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

app.use('/api/v1/webhooks', webhookRoutes);
const PORT = process.env.PORT || 5000;

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

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n OBYX API is cooking on port ${PORT}`);
    });
  } catch (err) {
    console.error(' Failed to start server:', err);
    process.exit(1);
  }
};

startServer();