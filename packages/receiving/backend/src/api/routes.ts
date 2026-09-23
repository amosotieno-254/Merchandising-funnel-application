import { Router } from 'express';
import {
  listExpectedDeliveries,
  listGoodsReceivedNotes,
  getGoodsReceivedNote,
  createGoodsReceivedNote,
} from './receivingControllers.js';

export const receivingRouter = Router();

receivingRouter.get('/expected-deliveries', listExpectedDeliveries);
receivingRouter.get('/goods-received-notes', listGoodsReceivedNotes);
receivingRouter.get('/goods-received-notes/:id', getGoodsReceivedNote);
receivingRouter.post('/goods-received-notes', createGoodsReceivedNote);