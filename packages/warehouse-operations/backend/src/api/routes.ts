import { Router } from 'express';
import {
  listStorageBins,
  createStorageBin,
  listPutawayTasks,
  completePutawayTask,
  listPickTasks,
  createPickTask,
  listStockTransfers,
  createStockTransfer,
} from './controllers.js';

export const warehouseRouter = Router();

warehouseRouter.get('/storage-bins', listStorageBins);
warehouseRouter.post('/storage-bins', createStorageBin);

warehouseRouter.get('/putaway-tasks', listPutawayTasks);
warehouseRouter.post('/putaway-tasks/:id/complete', completePutawayTask);

warehouseRouter.get('/pick-tasks', listPickTasks);
warehouseRouter.post('/pick-tasks', createPickTask);

warehouseRouter.get('/stock-transfers', listStockTransfers);
warehouseRouter.post('/stock-transfers', createStockTransfer);