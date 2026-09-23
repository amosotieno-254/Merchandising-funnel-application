import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

// Storage bins
export async function listStorageBins(_req: Request, res: Response) {
  res.json(ok(await service.listStorageBins()));
}

export async function createStorageBin(req: Request, res: Response) {
  res.status(201).json(ok(await service.createStorageBin(req.body)));
}

// Putaway tasks
export async function listPutawayTasks(_req: Request, res: Response) {
  res.json(ok(await service.listPutawayTasks()));
}

export async function completePutawayTask(req: Request, res: Response) {
  const { assignedBinId } = req.body;
  const completed = await service.completePutawayTask(
    req.params.id,
    assignedBinId
  );

  if (!completed) {
    return res.status(404).json(fail('Putaway task not found'));
  }

  res.json(ok(completed));
}

// Pick tasks
export async function listPickTasks(_req: Request, res: Response) {
  res.json(ok(await service.listPickTasks()));
}

export async function createPickTask(req: Request, res: Response) {
  res.status(201).json(ok(await service.createPickTask(req.body)));
}

// Stock transfers
export async function listStockTransfers(_req: Request, res: Response) {
  res.json(ok(await service.listStockTransfers()));
}

export async function createStockTransfer(req: Request, res: Response) {
  res.status(201).json(ok(await service.createStockTransfer(req.body)));
}