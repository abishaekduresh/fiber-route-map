import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthService } from '../services/AuthService.js';
import { auth } from '../middleware/auth.js';

export const authRoutes = (authService: AuthService) => {
  const router = Router();
  const controller = new AuthController(authService);

  router.post('/login', controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', auth(authService), controller.me);
  
  // Session management
  router.get('/sessions', auth(authService), controller.sessions);
  router.delete('/sessions/:uuid', auth(authService), controller.terminateSession);

  return router;
};
