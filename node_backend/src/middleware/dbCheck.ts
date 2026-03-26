import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Middleware to check database connectivity.
 * Performs a simple query to ensure the database is reachable.
 */
export const dbCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Perform a lightweight query to check connectivity
    await db.raw('SELECT 1');
    next();
  } catch (error: any) {
    logger.error('Database connectivity check failed', { 
      error: error.message,
      code: error.code,
      stack: error.stack 
    });

    // Pass a 503 Service Unavailable error if database is down
    const dbError: any = new Error('Database connection failed. Please ensure the database server is running.');
    dbError.status = 503;
    dbError.code = error.code;
    
    next(dbError);
  }
};
