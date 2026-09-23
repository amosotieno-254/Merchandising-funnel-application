import { Router } from 'express';
import {
  listStock,
  checkAvailability,
  receiveStock,
  sellStock,
} from './inventoryControllers.js';

export const inventoryRouter = Router();

inventoryRouter.get('/stock', listStock);
inventoryRouter.get('/stock/:productCode/available', checkAvailability);
inventoryRouter.post('/stock/receive', receiveStock);
inventoryRouter.post('/stock/sell', sellStock);