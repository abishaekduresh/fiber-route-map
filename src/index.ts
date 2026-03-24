import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { versionCheck } from './middleware/versionCheck.js';
import { requestId } from './middleware/requestId.js';
import userRoutes from './routes/userRoutes.js';
import logger from './utils/logger.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestId);
app.use(versionCheck);

// Routes
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'Fiber Route Map Node.js API' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
