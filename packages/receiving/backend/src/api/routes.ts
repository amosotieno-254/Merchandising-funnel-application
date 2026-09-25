import { Router, type RequestHandler } from 'express';
import {
  listExpectedDeliveries,
  listGoodsReceivedNotes,
  getGoodsReceivedNote,
  createGoodsReceivedNote,
} from './receivingControllers.js';

const handle =
  (fn: (...args: Parameters<RequestHandler>) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const receivingRouter = Router();

receivingRouter.get('/expected-deliveries', handle(listExpectedDeliveries));
receivingRouter.get('/goods-received-notes', handle(listGoodsReceivedNotes));
receivingRouter.get('/goods-received-notes/:id', handle(getGoodsReceivedNote));
receivingRouter.post('/goods-received-notes', handle(createGoodsReceivedNote));
