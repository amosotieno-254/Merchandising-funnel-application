import { Router } from 'express';
import {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  approvePurchaseOrder,
} from './controllers.js';

export const procurementRouter = Router();

procurementRouter.get('/purchase-orders', listPurchaseOrders);
procurementRouter.get('/purchase-orders/:id', getPurchaseOrder);
procurementRouter.post('/purchase-orders', createPurchaseOrder);
procurementRouter.post('/purchase-orders/:id/approve', approvePurchaseOrder);