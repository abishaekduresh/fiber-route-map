import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fiber Route Map API',
      version: '1.16.0',
      description: 'The authoritative backend REST API for the Fiber Route Map system.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Main API Path',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        mgmtAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Mgmt-Token',
          description: 'Short-lived Management Token for session termination',
        },
      },
      parameters: {
        ApiVersionHeader: {
          name: 'X-Api-Version',
          in: 'header',
          required: true,
          schema: {
            type: 'string',
            default: 'v1',
          },
          description: 'API Version (e.g., v1)',
        },
      },
    },
  },
  // Path to the API docs using absolute paths for reliability
  apis: [
    path.join(__dirname, 'schemas/*.ts'),
    path.join(__dirname, 'paths/*.ts'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
