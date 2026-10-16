import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listStorageBins(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listStorageBins()));
  } catch (err) {
    console.error('listStorageBins failed:', err);
    res.status(500).json(fail('Could not load storage bins'));
  }
}

export async function createStorageBin(req: Request, res: Response) {
  try {
    res.status(201).json(ok(await service.createStorageBin(req.body)));
  } catch (err) {
    console.error('createStorageBin failed:', err);
    res.status(500).json(fail('Could not create storage bin'));
  }
}

export async function listPutawayTasks(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listPutawayTasks()));
  } catch (err) {
    console.error('listPutawayTasks failed:', err);
    res.status(500).json(fail('Could not load putaway tasks'));
  }
}

export async function completePutawayTask(req: Request, res: Response) {
  try {
    const { assignedBinId } = req.body;
    const completed = await service.completePutawayTask(
      req.params.id,
      assignedBinId
    );

    if (!completed) {
      return res.status(404).json(fail('Putaway task not found'));
    }

    res.json(ok(completed));
  } catch (err) {
    console.error('completePutawayTask failed:', err);
    res.status(500).json(fail('Could not complete putaway task'));
  }
}

export async function listPickTasks(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listPickTasks()));
  } catch (err) {
    console.error('listPickTasks failed:', err);
    res.status(500).json(fail('Could not load pick tasks'));
  }
}

export async function createPickTask(req: Request, res: Response) {
  try {
    res.status(201).json(ok(await service.createPickTask(req.body)));
  } catch (err) {
    console.error('createPickTask failed:', err);
    res.status(500).json(fail('Could not create pick task'));
  }
}

export async function listStockTransfers(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listStockTransfers()));
  } catch (err) {
    console.error('listStockTransfers failed:', err);
    res.status(500).json(fail('Could not load stock transfers'));
  }
}

export async function createStockTransfer(req: Request, res: Response) {
  try {
    res.status(201).json(ok(await service.createStockTransfer(req.body)));
  } catch (err) {
    console.error('createStockTransfer failed:', err);
    res.status(500).json(fail('Could not create stock transfer'));
  }
}
