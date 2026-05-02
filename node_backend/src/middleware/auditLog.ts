import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/AuditLogService.js';
import logger from '../utils/logger.js';

// Paths that should never be audit-logged
const SKIP_PATHS = ['/api/health', '/api/docs', '/api/setup'];

// Request body fields that must be stripped before storing
const SENSITIVE_FIELDS = new Set([
  'password', 'confirmPassword', 'newPassword', 'currentPassword',
  'token', 'secret', 'apiKey', 'accessToken', 'refreshToken',
  'creditCard', 'cvv', 'ssn',
]);

function sanitizeBody(body: any): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function summarizeResponse(body: any): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;

  // For list responses, only keep pagination summary
  if (body.meta?.pagination) {
    return {
      success: body.success,
      statusCode: body.statusCode,
      message: body.message,
      pagination: body.meta.pagination,
    };
  }

  // For error responses, keep the error details
  if (body.success === false) {
    return {
      success: false,
      statusCode: body.statusCode,
      errorType: body.errorType,
      message: body.message,
    };
  }

  // For single-resource responses, keep minimal info
  if (body.data) {
    const data = Array.isArray(body.data) ? null : body.data;
    return {
      success: body.success,
      statusCode: body.statusCode,
      message: body.message,
      ...(data?.id ? { resourceId: data.id } : {}),
    };
  }

  return {
    success: body.success,
    statusCode: body.statusCode,
    message: body.message,
  };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

/**
 * Derives a semantic action name from the HTTP method and route.
 * Examples: POST /api/auth/users/login → auth.login
 *           DELETE /api/users/:uuid → user.delete
 */
function deriveAction(req: Request): string {
  const method = req.method.toUpperCase();
  const url = req.originalUrl || req.url;
  const resource = deriveResource(req);

  // Auth specific overrides
  if (url.includes('/auth/users/login')) return 'auth.login';
  if (url.includes('/auth/users/logout')) return 'auth.logout';
  if (url.includes('/auth/users/sessions')) {
    if (method === 'GET') return 'auth.sessions.list';
    if (method === 'DELETE') return 'auth.session.delete';
  }
  if (url.includes('/auth/me')) return 'auth.me.view';

  // Specific action patterns
  if (url.includes('/block')) return `${resource}.block`;
  if (url.includes('/unblock')) return `${resource}.unblock`;
  if (url.includes('/reset-password')) return `${resource}.reset-password`;
  if (url.includes('/sync')) return `${resource}.sync`;
  if (url.includes('/assign')) return `${resource}.assign`;
  if (url.includes('/export')) return `${resource}.export`;

  // Standard REST patterns
  if (method === 'GET') {
    // If it ends with the resource name (e.g. /api/users), it's a list
    const segment = url.split('?')[0].split('/').pop();
    if (segment === resource || segment === `${resource}s` || segment === 'tenant-business') {
      return `${resource}.list`;
    }
    return `${resource}.view`;
  }
  if (method === 'POST') return `${resource}.create`;
  if (method === 'PUT' || method === 'PATCH') return `${resource}.update`;
  if (method === 'DELETE') return `${resource}.delete`;

  return `${resource}.${method.toLowerCase()}`;
}

function deriveResource(req: Request): string {
  const base = req.baseUrl || req.path;
  const segment = base.replace('/api/', '').split('/')[0];

  const resourceMap: Record<string, string> = {
    'users': 'user',
    'roles': 'role',
    'permissions': 'permission',
    'countries': 'country',
    'tenants': 'tenant',
    'tenant-business': 'tenant_business',
    'audit-logs': 'audit_log',
    'auth': 'auth',
    'health': 'health',
    'setup': 'setup',
  };

  return resourceMap[segment] || segment;
}

// Track logged responses to prevent double logging if middleware is applied multiple times
const loggedResponses = new WeakSet<Response>();

export const auditLog = (auditLogService: AuditLogService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip non-loggable endpoints or methods early
    const fullPath = req.originalUrl || req.url;
    if (req.method === 'OPTIONS' || SKIP_PATHS.some(p => fullPath.startsWith(p))) {
      return next();
    }

    if (loggedResponses.has(res)) {
      return next();
    }
    loggedResponses.add(res);

    const startTime = Date.now();

    // Intercept res.json to capture the response body
    const originalJson = res.json.bind(res);
    let capturedBody: any = null;

    res.json = function (body: any) {
      capturedBody = body;
      return originalJson(body);
    };

    // Write audit log after response is fully sent
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const user = (req as any).user;
      const session = (req as any).session;
      
      const action = deriveAction(req);
      // logger.debug(`[AuditLog DEBUG] ${req.method} ${fullPath} (ID: ${reqId}) - res.on('finish') triggered, action: ${action}`);

      const finalStatus = capturedBody?.statusCode ?? res.statusCode;
      const success = capturedBody?.success ?? (res.statusCode < 400);

      // Fire-and-forget — never block the response
      auditLogService.log({
        actorType: user ? 'user' : 'anonymous',
        actorUuid: user?.uuid ?? null,
        actorName: user?.name ?? null,
        actorEmail: user?.email ?? null,
        actorRoles: user?.roles?.map((r: any) => r.slug) ?? [],
        action,
        resource: deriveResource(req),
        resourceUuid: (req.params?.uuid as string) ?? null,
        resourceName: null,
        httpMethod: req.method,
        endpoint: req.originalUrl,
        statusCode: finalStatus,
        success,
        requestBody: sanitizeBody(req.body),
        responseBody: summarizeResponse(capturedBody),
        ipAddress: getClientIp(req),
        userAgent: (req.headers['user-agent'] ?? null) as string | null,
        requestId: (req as any).requestId ?? null,
        sessionUuid: session?.uuid ?? null,
        durationMs,
        errorMessage: success ? null : (capturedBody?.message ?? null),
      }).catch((err: any) => {
        logger.warn('Audit log write failed', { error: err?.message });
      });
    });

    next();
  };
};
