import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { versionCheck } from './middleware/versionCheck.js';
import { requestId } from './middleware/requestId.js';
import { dbCheck } from './middleware/dbCheck.js';
import { auth } from './middleware/auth.js';
import userRoutes from './routes/userRoutes.js';
import countryRoutes from './routes/countryRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import logger from './utils/logger.js';
import db from './config/database.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swaggerConfig.js';
import { AuthService } from './services/AuthService.js';
import { AuthRepository } from './repositories/AuthRepository.js';
import { UserRepository } from './repositories/UserRepository.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize repositories and services
const authRepo = new AuthRepository();
const userRepo = new UserRepository();
const authService = new AuthService(authRepo, userRepo);

// Use extended query parser (qs) to support nested bracket notation like filter[status]=active
app.set('query parser', 'extended');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestId);
app.use(versionCheck);
app.use(dbCheck);

// Routes
app.use('/api/auth', authRoutes(authService));
app.use('/api/users', auth(authService), userRoutes);
app.use('/api/countries', auth(authService), countryRoutes);
app.use('/api/roles', auth(authService), roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Fiber Route Map Node.js API' });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Verify database connection on startup
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error: any) {
    logger.error('Initial database connection failed. Server is starting but database-dependent routes will return connectivity errors.', {
      error: error.message,
      code: error.code
    });
  }

  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
};

startServer();
