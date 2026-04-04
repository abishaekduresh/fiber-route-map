import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email, username, or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Support both 'identifier' and 'email' for backward compatibility
      const body = { ...req.body };
      if (!body.identifier && body.email) {
        body.identifier = body.email;
      }

      const deviceInfo = {
        deviceId: (Array.isArray(req.headers['x-device-id']) ? req.headers['x-device-id'][0] : req.headers['x-device-id'] as string) || undefined,
        deviceName: (Array.isArray(req.headers['x-device-name']) ? req.headers['x-device-name'][0] : req.headers['x-device-name'] as string) || undefined,
        ipAddress: req.ip || undefined,
        userAgent: (Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'] as string) || undefined
      };

      const { identifier, password } = loginSchema.parse(body);
      const { user, session } = await this.authService.login(identifier, password, deviceInfo);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: {
          user: this.transformUser(user),
          token: session.sessionToken,
          expiresAt: session.expiresAt
        },
        meta: this.getMeta(req)
      });
    } catch (error: any) {
      if (error.code === 'SESSION_LIMIT_REACHED') {
        return res.status(200).json({
          success: false,
          statusCode: 403,
          errorType: 'SESSION_LIMIT_REACHED',
          message: error.message,
          data: {
            activeSessions: error.activeSessions.map((s: any) => ({
              ...s,
              links: {
                terminate: `/api/auth/users/sessions/${s.uuid}`
              }
            })),
            mgmtToken: error.mgmtToken
          },
          links: {
            sessions: '/api/auth/users/sessions'
          },
          meta: this.getMeta(req)
        });
      }
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        await this.authService.logout(token);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Logout successful',
        meta: this.getMeta(req)
      });
    } catch (error) {
      next(error);
    }
  };

  sessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const sessions = await this.authService.getUserSessions(user.id);
      
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Active sessions retrieved successfully',
        data: sessions.map((s) => this.transformSession(s)),
        meta: this.getMeta(req)
      });
    } catch (error) {
      next(error);
    }
  };

  terminateSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { uuid } = req.params;
      
      const success = await this.authService.terminateSession(uuid as string, user.id);
      
      if (!success) {
        return res.status(200).json({
          success: false,
          statusCode: 404,
          errorType: 'NOT_FOUND',
          message: 'Session not found or already terminated',
          meta: this.getMeta(req)
        });
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Session terminated successfully',
        meta: this.getMeta(req)
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const sessions = await this.authService.getUserSessions(user.id);
      
      const currentSessionUuid = (req as any).session?.uuid;
      
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User profile retrieved successfully',
        data: {
          user: this.transformUser(user),
          sessions: sessions.map((s) => this.transformSession(s, currentSessionUuid))
        },
        meta: this.getMeta(req)
      });
    } catch (error) {
      next(error);
    }
  };

  private transformUser = (user: any) => {
    const { uuid, createdAt, updatedAt, email, username, name, phone, status, country, roles, permissions } = user;
    return {
      id: uuid,
      type: 'user',
      attributes: {
        email,
        username,
        name,
        phone,
        status,
        country,
        roles,
        permissions: permissions || []
      },
      meta: {
        createdAt,
        updatedAt
      },
      links: {
        self: `/api/users/${uuid}`
      }
    };
  };

  private transformSession = (session: any, currentUuid?: string) => {
    return {
      id: session.uuid,
      type: 'session',
      attributes: {
        deviceName: session.deviceName || 'Unknown Device',
        deviceId: session.deviceId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        isCurrent: currentUuid ? session.uuid === currentUuid : false
      },
      meta: {
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      links: {
        self: `/api/auth/users/sessions/${session.uuid}`
      }
    };
  };

  private getMeta = (req: Request) => {
    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1.13.0'
    };
  };
}
