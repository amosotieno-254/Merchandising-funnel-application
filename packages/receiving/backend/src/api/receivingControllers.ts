import type { Request, Response } from 'express';
import { z } from 'zod';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

const createGoodsReceivedNoteSchema = z.object({
  purchaseOrderId: z.uuid(),
  supplierId: z.uuid(),
  lines: z
    .array(
      z.object({
        productCode: z.string().min(1),
        orderedQuantity: z.number().int().nonnegative(),
        receivedQuantity: z.number().int().nonnegative(),
        condition: z.enum(['GOOD', 'DAMAGED']).optional(),
      })
    )
    .min(1, { message: 'At least one line is required' }),
});

export async function listExpectedDeliveries(_req: Request, res: Response) {
  res.json(ok(await service.listExpectedDeliveries()));
}

export async function listGoodsReceivedNotes(_req: Request, res: Response) {
  res.json(ok(await service.listGoodsReceivedNotes()));
}

export async function getGoodsReceivedNote(req: Request, res: Response) {
  if (!z.uuid().safeParse(req.params.id).success) {
    return res.status(404).json(fail('Goods Received Note not found'));
  }
  const note = await service.getGoodsReceivedNoteWithLines(req.params.id);
  if (!note) return res.status(404).json(fail('Goods Received Note not found'));
  res.json(ok(note));
}

export async function createGoodsReceivedNote(req: Request, res: Response) {
  const parsed = createGoodsReceivedNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res
      .status(400)
      .json(fail(`${issue.path.join('.') || 'body'}: ${issue.message}`));
  }
  const created = await service.createGoodsReceivedNote(parsed.data);
  res.status(201).json(ok(created));
}
