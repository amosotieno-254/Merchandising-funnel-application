import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listExpectedDeliveries(_req: Request, res: Response) {
  res.json(ok(await service.listExpectedDeliveries()));
}

export async function listGoodsReceivedNotes(_req: Request, res: Response) {
  res.json(ok(await service.listGoodsReceivedNotes()));
}

export async function getGoodsReceivedNote(req: Request, res: Response) {
  const note = await service.getGoodsReceivedNoteWithLines(req.params.id);
  if (!note) return res.status(404).json(fail('Goods Received Note not found'));
  res.json(ok(note));
}

export async function createGoodsReceivedNote(req: Request, res: Response) {
  const created = await service.createGoodsReceivedNote(req.body);
  res.status(201).json(ok(created));
}