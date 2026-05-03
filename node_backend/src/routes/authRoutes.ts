import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthService } from '../services/AuthService.js';
import { auth } from '../middleware/auth.js';
import { tenantAuth } from '../middleware/tenantAuth.js';

export const authRoutes = (authService: AuthService) => {
  const router = Router();
  const controller = new AuthController(authService);
  const tenantRepo = authService.tenantRepo;

  const userRouter = Router();
  userRouter.post('/login', controller.login);
  userRouter.post('/logout', controller.logout);

  // Session management
  userRouter.get('/sessions', auth(authService), controller.sessions);
  userRouter.delete('/sessions/:uuid', auth(authService), controller.terminateSession);

  // Tenant impersonation (super-admin only)
  userRouter.post('/impersonate/:tenantUuid', auth(authService), controller.impersonateTenant);

  router.use('/users', userRouter);

  const tenantRouter = Router();
  tenantRouter.post('/login', controller.tenantLogin);
  tenantRouter.post('/refresh', controller.refreshTenantToken);
  tenantRouter.post('/change-password', tenantAuth(tenantRepo), controller.changeTenantPassword);
  tenantRouter.post('/logout', controller.tenantLogout);
  tenantRouter.delete('/sessions/:uuid', controller.terminateTenantSession);
  router.use('/tenant', tenantRouter);

  router.get('/me', auth(authService), controller.me);

  return router;
};
