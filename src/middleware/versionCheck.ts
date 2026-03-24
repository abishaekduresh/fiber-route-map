import { Request, Response, NextFunction } from 'express';

const REQUIRED_VERSION = process.env.API_VERSION || null;

/**
 * Middleware to enforce X-API-Version header and validate it against the current API version.
 */
export const versionCheck = (req: Request, res: Response, next: NextFunction) => {
  // Only enforce on /api routes, excluding root or other paths if necessary
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const apiVersion = req.header('X-API-Version');

  if (!apiVersion) {
    const error = new Error('API version header (X-API-Version) is required');
    (error as any).status = 400;
    return next(error);
  }

  if (apiVersion !== REQUIRED_VERSION) {
    const error = new Error(`API version '${apiVersion}' is not supported. Required: ${REQUIRED_VERSION}`);
    (error as any).status = 400;
    return next(error);
  }

  next();
};
