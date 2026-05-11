import { Request, Response } from 'express';
import db from '../config/database.js';
import logger from '../utils/logger.js';

/** Actionable fix suggestions keyed by MySQL/MariaDB/common error codes. */
function getDbSuggestions(code: string | undefined): string[] {
  switch (code) {
    case 'ECONNREFUSED':
      return [
        'The database server is not running or is refusing connections on the configured port.',
        `Check DB_HOST="${process.env.DB_HOST}" and DB_PORT="${process.env.DB_PORT}" in your .env file.`,
        'Start the database service: e.g. net start MySQL (Windows) or systemctl start mysql (Linux).',
      ];
    case 'ETIMEDOUT':
    case 'ECONNABORTED':
      return [
        'Connection to the database timed out.',
        `Verify DB_HOST="${process.env.DB_HOST}" is reachable and no firewall is blocking the port.`,
        'Check network connectivity between the backend and the database server.',
      ];
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return [
        `Cannot resolve database hostname: "${process.env.DB_HOST}".`,
        'Check DB_HOST in your .env — it may be misspelled or the DNS entry is missing.',
        'Use an IP address instead of a hostname if DNS resolution is unreliable.',
      ];
    case 'ER_ACCESS_DENIED_ERROR':
      return [
        `Access denied for user "${process.env.DB_USER}" — wrong credentials.`,
        'Check DB_USER and DB_PASS in your .env file.',
        `Run: GRANT ALL ON ${process.env.DB_NAME}.* TO '${process.env.DB_USER}'@'${process.env.DB_HOST}'; FLUSH PRIVILEGES;`,
      ];
    case 'ER_BAD_DB_ERROR':
      return [
        `Database "${process.env.DB_NAME}" does not exist.`,
        `Create it: CREATE DATABASE \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
        'Then re-run the setup wizard or run database migrations.',
      ];
    case 'ER_HOST_NOT_PRIVILEGED':
    case 'ER_HOST_IS_BLOCKED':
      return [
        'This host is not allowed to connect to the database server.',
        `Grant access: GRANT ALL ON ${process.env.DB_NAME}.* TO '${process.env.DB_USER}'@'%'; FLUSH PRIVILEGES;`,
      ];
    case 'ER_NOT_SUPPORTED_AUTH_MODE':
      return [
        'Authentication plugin incompatibility between the Node.js MySQL driver and the server.',
        `Run: ALTER USER '${process.env.DB_USER}'@'${process.env.DB_HOST}' IDENTIFIED WITH mysql_native_password BY '${process.env.DB_USER}';`,
        'Then restart the backend.',
      ];
    default:
      return [
        'Review the raw error code and message above for details.',
        'Confirm DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASS are set correctly in your .env file.',
        'Check the backend log for the full stack trace.',
      ];
  }
}

export class HealthController {
  /**
   * Performs a health check on the API and its dependencies.
   * In development+debug mode, includes diagnostic details for troubleshooting.
   */
  public check = async (req: Request, res: Response): Promise<void> => {
    const isDebug =
      process.env.APP_ENV === 'development' && process.env.DEBUG === 'true';

    const healthStatus: any = {
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      services: {
        database: 'unknown',
      },
      ...(isDebug && { debugMode: true }),
    };

    try {
      await db.raw('SELECT 1');
      healthStatus.services.database = 'connected';
      res.status(200).json(healthStatus);
    } catch (error: any) {
      logger.error('Health check failed', {
        error: error.message,
        code: error.code,
      });

      healthStatus.success = false;
      healthStatus.statusCode = 503;
      healthStatus.errorType = 'DATABASE_ERROR';
      healthStatus.services.database = 'disconnected';
      healthStatus.error = error.message;

      if (isDebug) {
        healthStatus.debug = {
          appEnv: process.env.APP_ENV,
          debugFlag: process.env.DEBUG,
          dbHost: process.env.DB_HOST,
          dbPort: process.env.DB_PORT,
          dbName: process.env.DB_NAME,
          dbUser: process.env.DB_USER,
          dbCharset: process.env.DB_CHARSET,
          errorMessage: error.message,
          errorCode: error.code || 'UNKNOWN',
          suggestions: getDbSuggestions(error.code),
        };
      }

      res.status(503).json(healthStatus);
    }
  };
}
