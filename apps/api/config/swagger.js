import swaggerJsdoc from 'swagger-jsdoc';
import config from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Obyx API',
      version: '1.0.0',
      description: 'Obyx on-ramp/off-ramp orchestrator API for the African market',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Main API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['ONRAMP', 'OFFRAMP'] },
            status: { type: 'string', enum: ['PENDING', 'FIAT_PROCESSING', 'FIAT_RECEIVED', 'CRYPTO_PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
            fiatAmount: { type: 'number' },
            fiatCurrency: { type: 'string' },
            cryptoAmount: { type: 'number' },
            cryptoCurrency: { type: 'string' },
            exchangeRate: { type: 'number' },
            paystackReference: { type: 'string', nullable: true },
            txHash: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
      },
    },
  },
  // Look for JSDoc comments in these files
  apis: ['./routes/*.js', './models/*.js'], 
};

export const swaggerSpec = swaggerJsdoc(options);
