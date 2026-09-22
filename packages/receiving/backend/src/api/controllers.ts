import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import {
  goodsReceivedNotes,
  goodsReceivedNoteLines,
  expectedDeliveries,
} from '../infrastructure/schema.js';
import { ok, fail } from '@mms/shared';
import { publishGoodsReceived } from '../events/publisher.js';

export async function listExpectedDeliveries(_req: Request, res: Response) {
  const rows = await db.select().from(expectedDeliveries);
  res.json(ok(rows));
}

export async function listGoodsReceivedNotes(_req: Request, res: Response) {
  const rows = await db.select().from(goodsReceivedNotes);
  res.json(ok(rows));
}

export async function getGoodsReceivedNote(req: Request, res: Response) {
  const [note] = await db
    .select()
    .from(goodsReceivedNotes)
    .where(eq(goodsReceivedNotes.id, req.params.id));

  if (!note) return res.status(404).json(fail('Goods Received Note not found'));

  const lines = await db
    .select()
    .from(goodsReceivedNoteLines)
    .where(eq(goodsReceivedNoteLines.goodsReceivedNoteId, note.id));

  res.json(ok({ ...note, lines }));
}

export async function createGoodsReceivedNote(req: Request, res: Response) {
  const { purchaseOrderId, supplierId, lines } = req.body as {
    purchaseOrderId: string;
    supplierId: string;
    lines: Array<{
      productCode: string;
      orderedQuantity: number;
      receivedQuantity: number;
      condition?: 'GOOD' | 'DAMAGED';
    }>;
  };

  const isPartial = lines.some((l) => l.receivedQuantity < l.orderedQuantity);

  const [note] = await db
    .insert(goodsReceivedNotes)
    .values({
      purchaseOrderId,
      supplierId,
      status: isPartial ? 'PARTIAL' : 'COMPLETE',
    })
    .returning();

  await db.insert(goodsReceivedNoteLines).values(
    lines.map((l) => ({
      goodsReceivedNoteId: note.id,
      productCode: l.productCode,
      orderedQuantity: l.orderedQuantity,
      receivedQuantity: l.receivedQuantity,
      condition: l.condition ?? 'GOOD',
    }))
  );

  await publishGoodsReceived({
    goodsReceivedNoteId: note.id,
    purchaseOrderId,
    supplierId,
    lines: lines.map((l) => ({
      productCode: l.productCode,
      receivedQuantity: l.receivedQuantity,
      condition: l.condition ?? 'GOOD',
    })),
  });

  res.status(201).json(ok(note));
}