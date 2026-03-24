import { Request, Response, NextFunction } from 'express';
import { nowDb } from '../utils/time.js';
import logger from '../utils/logger.js';

const getHelpMessage = (status: number, message: string): string => {
  switch (status) {
    case 400:
      return 'The request could not be understood or was missing required parameters. Please check your input.';
    case 401:
      return 'Authentication is required to access this resource. Please provide a valid token.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource could not be found. Verify the ID or URL.';
    case 409:
      if (message.includes('Phone')) {
        return 'This phone number is already in use. Please use a different number or recover your account.';
      }
      if (message.includes('Email')) {
        return 'This email address is already in use. Try logging in or use a different email.';
      }
      return 'A conflict occurred with the current state of the resource.';
    case 500:
      return 'An internal server error occurred. Our team has been notified. Please try again later.';
    default:
      return 'Please verify the request parameters or refer to the API documentation.';
  }
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Specific handling for Zod validation errors
  if (err.name === 'ZodError') {
    status = 400;
    const issues = err.issues || err.errors || [];
    // Include the field name (path) in the error message for better clarity
    message = 'Validation failed: ' + issues.map((e: any) => {
      const field = e.path.join('.');
      return field ? `${field}: ${e.message}` : e.message;
    }).join(', ');
  }

  // Always maintain HTTP 200 status for all API responses as per requirements.
  // The actual error status is included in the JSON body as errorCode.

  if (status >= 500) {
    logger.error(`${req.method} ${req.url} - ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.url} - ${message}`);
  }

  res.status(200).json({
    success: false,
    statusCode: status,
    message,
    help: getHelpMessage(status, message),
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1'
    },
    ...(process.env.NODE_ENV === 'development' && status >= 500 && { stack: err.stack }),
  });
};
