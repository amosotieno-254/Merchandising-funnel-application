import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listStock(_req: Request, res: Response) {
  res.json(ok(await service.listStock()));
}

export async function checkAvailability(req: Request, res: Response) {
  const available = await service.getAvailableQuantity(
    req.params.productCode,
    req.query.location as string
  );
  res.json(ok({ available }));
}

export async function receiveStock(req: Request, res: Response) {
  const { productCode, location, quantity, unitCost } = req.body;
  const result = await service.receiveStock({
    productCode,
    location,
    quantity,
    unitCost,
  });
  res.status(201).json(ok(result));
}

export async function sellStock(req: Request, res: Response) {
  const { productCode, location, quantity } = req.body;
  const result = await service.sellStock({
    productCode,
    location,
    quantity,
  });

  if ('error' in result) {
    return res.status(400).json(fail('query parameter "location"is required'));
  }

  res.json(ok(result.data));
}