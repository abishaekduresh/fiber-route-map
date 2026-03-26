import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthService } from '../services/AuthService.js';
import { auth } from '../middleware/auth.js';

export const authRoutes = (authService: AuthService) => {
  const router = Router();
  const controller = new AuthController(authService);

  const userRouter = Router();
  userRouter.post('/login', controller.login);
  userRouter.post('/logout', controller.logout);
  
  // Session management
  userRouter.get('/sessions', auth(authService), controller.sessions);
  userRouter.delete('/sessions/:uuid', auth(authService), controller.terminateSession);

  router.use('/users', userRouter);
  router.get('/me', auth(authService), controller.me);

  return router;
};
