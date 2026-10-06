import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listSales(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listSales()));
  } catch (err) {
    console.error('listSales failed:', err);
    res.status(500).json(fail('Could not load sales'));
  }
}

export async function getSale(req: Request, res: Response) {
  try {
    const sale = await service.getSaleWithLines(req.params.id);
    if (!sale) return res.status(404).json(fail('Sale not found'));
    res.json(ok(sale));
  } catch (err) {
    console.error('getSale failed:', err);
    res.status(500).json(fail('Could not load sale'));
  }
}

export async function createSale(req: Request, res: Response) {
  try {
    const result = await service.createSale(req.body);
    if (result.error) return res.status(400).json(fail(result.error));
    res.status(201).json(ok(result.data));
  } catch (err: any) {
    console.error('createSale failed:', err);
    if (err?.code === 14 || err?.code === 4) {
      return res
        .status(503)
        .json(fail('Inventory service is unavailable, could not check stock. Please try again.'));
    }
    res.status(500).json(fail('Could not complete sale'));
  }
}
