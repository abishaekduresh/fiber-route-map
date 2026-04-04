import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SetupService } from '../services/SetupService.js';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const testConnectionSchema = z.object({
  dbHost: z.string().min(1, 'Host is required'),
  dbPort: z.coerce.number().int().min(1).max(65535).default(3306),
  dbName: z.string().min(1, 'Database name is required'),
  dbUser: z.string().min(1, 'Username is required'),
  dbPass: z.string(),
  dbCharset: z.string().default('utf8mb4'),
});

const runSchema = z.object({
  env: z.object({
    dbHost: z.string().min(1, 'Database host is required'),
    dbPort: z.coerce.number().int().min(1).max(65535).default(3306),
    dbName: z.string().min(1, 'Database name is required'),
    dbUser: z.string().min(1, 'Database user is required'),
    dbPass: z.string(),
    dbCharset: z.string().default('utf8mb4'),
    timezone: z.string().min(1, 'Timezone is required'),
    port: z.coerce.number().int().min(1).max(65535).default(3001),
    apiVersion: z.string().default('v1'),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  }),
  admin: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  }).refine(
    (d) => d.password === d.confirmPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] }
  ),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class SetupController {
  private service: SetupService;

  constructor() {
    this.service = new SetupService();
  }

  private getMeta(req: Request) {
    return {
      requestId: (req as any).requestId || 'setup',
      timestamp: new Date().toISOString(),
      version: `v${process.env.API_VERSION || '1.0.0'}`,
    };
  }

  // GET /api/setup/status
  status = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await this.service.getStatus();
      res.json({
        success: true,
        statusCode: 200,
        message: status.isComplete ? 'Setup is complete' : 'Setup is required',
        data: status,
        meta: this.getMeta(req),
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/setup/test-connection
  testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = testConnectionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.json({
          success: false,
          statusCode: 422,
          errorType: 'VALIDATION_ERROR',
          message: `Validation failed: ${parsed.error.issues[0]?.message}`,
          meta: this.getMeta(req),
        });
        return;
      }

      const result = await this.service.testConnection(parsed.data);
      res.json({
        success: result.success,
        statusCode: result.success ? 200 : 503,
        message: result.message,
        meta: this.getMeta(req),
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/setup/reset
  reset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Guard: cannot reset a completed setup without manual .env edit
      if (process.env.SETUP_COMPLETE === 'true') {
        res.json({
          success: false,
          statusCode: 409,
          errorType: 'SETUP_COMPLETE',
          message: 'Setup is marked as complete. To reset, remove SETUP_COMPLETE=true from your .env and restart the server.',
          meta: this.getMeta(req),
        });
        return;
      }

      const result = await this.service.resetSetup();
      res.json({
        success: result.success,
        statusCode: result.success ? 200 : 500,
        message: result.message,
        meta: this.getMeta(req),
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/setup/run
  run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Guard: block re-runs if setup is complete
      if (process.env.SETUP_COMPLETE === 'true') {
        res.json({
          success: false,
          statusCode: 409,
          errorType: 'SETUP_COMPLETE',
          message: 'Setup is already complete. Re-running setup is not allowed.',
          help: 'To re-run setup, remove SETUP_COMPLETE=true from your .env file and restart the server.',
          meta: this.getMeta(req),
        });
        return;
      }

      const parsed = runSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        res.json({
          success: false,
          statusCode: 422,
          errorType: 'VALIDATION_ERROR',
          message: `Validation failed: ${firstError?.path.join('.')}: ${firstError?.message}`,
          errors: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
          meta: this.getMeta(req),
        });
        return;
      }

      const { env, admin } = parsed.data;
      const { confirmPassword, ...adminData } = admin;

      const result = await this.service.runFullSetup({ env, admin: adminData });

      res.json({
        success: result.success,
        statusCode: result.success ? 200 : 500,
        message: result.success
          ? 'Setup completed successfully! Your application is ready.'
          : 'Setup failed. See step details for more information.',
        data: { steps: result.steps },
        meta: this.getMeta(req),
      });
    } catch (error) {
      next(error);
    }
  };
}
