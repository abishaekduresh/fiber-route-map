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

      const { identifier, password } = loginSchema.parse(body);
      const { user, session } = await this.authService.login(identifier, password);

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
    } catch (error) {
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

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User profile retrieved successfully',
        data: this.transformUser(user),
        meta: this.getMeta(req)
      });
    } catch (error) {
      next(error);
    }
  };

  private transformUser = (user: any) => {
    const { uuid, createdAt, updatedAt, email, username, name, phone, status, country, roles } = user;
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
        roles
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

  private getMeta = (req: Request) => {
    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1.7.0'
    };
  };
}
