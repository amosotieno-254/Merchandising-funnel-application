import { Router } from 'express';
import {
  listRegisterSessions,
  listRegisterClosures,
  getRegisterSession,
  openRegister,
  closeRegister,
} from './sales-auditControllers.js';

export const salesAuditRouter = Router();

salesAuditRouter.get('/register-sessions', listRegisterSessions);
salesAuditRouter.get('/register-sessions/:id', getRegisterSession);
salesAuditRouter.post('/register-sessions', openRegister);
salesAuditRouter.post('/register-sessions/:id/close', closeRegister);

salesAuditRouter.get('/register-closures', listRegisterClosures);