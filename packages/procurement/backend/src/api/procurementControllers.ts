import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listPurchaseOrders(_req: Request, res: Response) {
  res.json(ok(await service.listPurchaseOrders()));
}

export async function getPurchaseOrder(req: Request, res: Response) {
  const po = await service.getPurchaseOrderWithLines(req.params.id);
  if (!po) return res.status(404).json(fail('PO not found'));
  res.json(ok(po));
}

export async function createPurchaseOrder(req: Request, res: Response) {
  const created = await service.createPurchaseOrder(req.body);
  res.status(201).json(ok(created));
}

export async function approvePurchaseOrder(req: Request, res: Response) {
  const approved = await service.approvePurchaseOrder(req.params.id);
  if (!approved) return res.status(404).json(fail('PO not found'));
  res.json(ok(approved));
}