import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fiber Route Map API',
      version: '1.13.0',
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
    },
  },
  // Path to the API docs
  apis: ['./src/docs/**/*.doc.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
