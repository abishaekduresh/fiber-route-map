import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to attach a unique request ID to each request.
 * This ID is used in the response metadata for tracing.
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // Generate a short ID if possible, or use uuid
  const id = `req_${uuidv4().split('-')[0]}`;
  (req as any).requestId = id;
  next();
};
