import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { database } from '../infrastructure/db.js';
import {
  storageBins,
  putawayTasks,
  pickTasks,
  stockTransfers,
} from '../infrastructure/schema.js';
import { ok as successResponse, fail as errorResponse } from '@mms/shared';

// ----- Storage Bins -----

export async function listStorageBins(_request: Request, response: Response) {
  const bins = await database.select().from(storageBins);
  response.json(successResponse(bins));
}

export async function createStorageBin(request: Request, response: Response) {
  const { binCode, zone, capacity } = request.body;
  const [createdBin] = await database
    .insert(storageBins)
    .values({ binCode, zone, capacity })
    .returning();
  response.status(201).json(successResponse(createdBin));
}

// ----- Putaway Tasks -----

export async function listPutawayTasks(_request: Request, response: Response) {
  const tasks = await database.select().from(putawayTasks);
  response.json(successResponse(tasks));
}

export async function completePutawayTask(request: Request, response: Response) {
  const { assignedBinId } = request.body;

  const [completedTask] = await database
    .update(putawayTasks)
    .set({ status: 'COMPLETED', assignedBinId })
    .where(eq(putawayTasks.id, request.params.id))
    .returning();

  if (!completedTask) {
    return response.status(404).json(errorResponse('Putaway task not found'));
  }

  response.json(successResponse(completedTask));
}

// ----- Pick Tasks -----

export async function listPickTasks(_request: Request, response: Response) {
  const tasks = await database.select().from(pickTasks);
  response.json(successResponse(tasks));
}

export async function createPickTask(request: Request, response: Response) {
  const { productCode, quantity, fromBinId } = request.body;
  const [createdTask] = await database
    .insert(pickTasks)
    .values({ productCode, quantity, fromBinId })
    .returning();
  response.status(201).json(successResponse(createdTask));
}

// ----- Stock Transfers -----

export async function listStockTransfers(_request: Request, response: Response) {
  const transfers = await database.select().from(stockTransfers);
  response.json(successResponse(transfers));
}

export async function createStockTransfer(request: Request, response: Response) {
  const { productCode, fromLocation, toLocation, quantity } = request.body;
  const [createdTransfer] = await database
    .insert(stockTransfers)
    .values({ productCode, fromLocation, toLocation, quantity })
    .returning();
  response.status(201).json(successResponse(createdTransfer));
}