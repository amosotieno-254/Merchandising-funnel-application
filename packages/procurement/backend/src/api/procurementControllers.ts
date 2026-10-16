import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listPurchaseOrders(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listPurchaseOrders()));
  } catch (err) {
    console.error('listPurchaseOrders failed:', err);
    res.status(500).json(fail('Could not load purchase orders'));
  }
}

export async function getPurchaseOrder(req: Request, res: Response) {
  try {
    const po = await service.getPurchaseOrderWithLines(req.params.id);
    if (!po) return res.status(404).json(fail('PO not found'));
    res.json(ok(po));
  } catch (err) {
    console.error('getPurchaseOrder failed:', err);
    res.status(500).json(fail('Could not load PO'));
  }
}

export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const created = await service.createPurchaseOrder(req.body);
    res.status(201).json(ok(created));
  } catch (err) {
    console.error('createPurchaseOrder failed:', err);
    res.status(500).json(fail('Could not create PO'));
  }
}

export async function approvePurchaseOrder(req: Request, res: Response) {
  try {
    const approved = await service.approvePurchaseOrder(req.params.id);
    if (!approved) return res.status(404).json(fail('PO not found'));
    res.json(ok(approved));
  } catch (err) {
    console.error('approvePurchaseOrder failed:', err);
    res.status(500).json(fail('Could not approve PO'));
  }
}
