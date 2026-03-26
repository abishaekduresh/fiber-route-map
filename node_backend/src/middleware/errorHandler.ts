import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { ErrorType } from '../utils/errorTypes.js';

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
    case 503:
      return 'The database service is currently unavailable. Please ensure the database server is running and try again.';
    default:
      return 'Please verify the request parameters or refer to the API documentation.';
  }
};

const getErrorType = (status: number, err: any): string => {
  // Use explicit errorType or code if provided
  if (err.errorType) return err.errorType;
  if (err.code === 'SESSION_LIMIT_REACHED') return ErrorType.SESSION_LIMIT_REACHED;

  // Handle specific error names
  if (err.name === 'ZodError') return ErrorType.VALIDATION_ERROR;

  // Map status codes to default types
  switch (status) {
    case 400: return ErrorType.BAD_REQUEST;
    case 401: return ErrorType.UNAUTHORIZED;
    case 403: return ErrorType.FORBIDDEN;
    case 404: return ErrorType.NOT_FOUND;
    case 409: return ErrorType.CONFLICT;
    case 429: return ErrorType.RATE_LIMIT_EXCEEDED;
    case 503: return ErrorType.SERVICE_UNAVAILABLE;
    default: return ErrorType.INTERNAL_SERVER_ERROR;
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
    message = 'Validation failed: ' + issues.map((e: any) => {
      const field = e.path.join('.');
      return field ? `${field}: ${e.message}` : e.message;
    }).join(', ');
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.url} - ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.url} - ${message}`);
  }

  res.status(200).json({
    success: false,
    statusCode: status,
    errorType: getErrorType(status, err),
    message,
    help: getHelpMessage(status, message),
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1.13.0'
    },
    ...(process.env.NODE_ENV === 'development' && status >= 500 && { stack: err.stack }),
  });
};
