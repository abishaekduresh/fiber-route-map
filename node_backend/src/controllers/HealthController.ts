import { Request, Response } from 'express';
import db from '../config/database.js';
import logger from '../utils/logger.js';

export class HealthController {
  /**
   * Performs a health check on the API and its dependencies.
   */
  public check = async (req: Request, res: Response): Promise<void> => {
    const healthStatus: any = {
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      services: {
        database: 'unknown'
      }
    };

    try {
      // Check database connectivity
      await db.raw('SELECT 1');
      healthStatus.services.database = 'connected';
      
      res.status(200).json(healthStatus);
    } catch (error: any) {
      logger.error('Health check failed', { 
        error: error.message,
        code: error.code 
      });

      healthStatus.success = false;
      healthStatus.statusCode = 503;
      healthStatus.errorType = 'Database connection error';
      healthStatus.services.database = 'disconnected';
      healthStatus.error = error.message;

      // Return 503 Service Unavailable if critical dependencies are down
      res.status(503).json(healthStatus);
    }
  };
}
