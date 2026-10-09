import { Router } from 'express';
import { listSales, getSale, createSale } from './Retail-salesControllers.js';

export const retailSalesRouter = Router();

retailSalesRouter.get('/sales', listSales);
retailSalesRouter.get('/sales/:id', getSale);
retailSalesRouter.post('/sales', createSale);