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
    },
  },
  // Look for JSDoc comments in these files
  apis: ['./routes/*.js', './models/*.js'], 
};

export const swaggerSpec = swaggerJsdoc(options);
