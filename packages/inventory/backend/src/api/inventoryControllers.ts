import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listStock(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listStock()));
  } catch (err) {
    console.error('listStock failed:', err);
    res.status(500).json(fail('Could not load stock'));
  }
}

export async function checkAvailability(req: Request, res: Response) {
  try {
    const available = await service.getAvailableQuantity(
      req.params.productCode,
      req.query.location as string
    );
    res.json(ok({ available }));
  } catch (err) {
    console.error('checkAvailability failed:', err);
    res.status(500).json(fail('Could not check availability'));
  }
}

export async function receiveStock(req: Request, res: Response) {
  try {
    const { productCode, location, quantity, unitCost } = req.body;
    const result = await service.receiveStock({
      productCode,
      location,
      quantity,
      unitCost,
    });
    res.status(201).json(ok(result));
  } catch (err) {
    console.error('receiveStock failed:', err);
    res.status(500).json(fail('Could not receive stock'));
  }
}

export async function sellStock(req: Request, res: Response) {
  try {
    const { productCode, location, quantity } = req.body;
    const result = await service.sellStock({
      productCode,
      location,
      quantity,
    });

    if (result.error) {
      return res.status(400).json(fail(result.error));
    }

    res.json(ok(result.data));
  } catch (err) {
    console.error('sellStock failed:', err);
    res.status(500).json(fail('Could not sell stock'));
  }
}
