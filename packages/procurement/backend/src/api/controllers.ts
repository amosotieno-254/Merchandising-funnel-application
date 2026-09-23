import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import { purchaseOrders, purchaseOrderLines } from '../infrastructure/schema.js';
import { ok, fail } from '@mms/shared';
import { publishPurchaseOrderApproved } from '../events/publisher.js';

export async function listPurchaseOrders(_req: Request, res: Response) {
  const rows = await db.select().from(purchaseOrders);
  res.json(ok(rows));
}

export async function getPurchaseOrder(req: Request, res: Response) {
  const [po] = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, req.params.id));

  if (!po) return res.status(404).json(fail('PO not found'));

  const lines = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.poId, po.id));

  res.json(ok({ ...po, lines }));
}

export async function createPurchaseOrder(req: Request, res: Response) {
  const { supplierId, paymentTerms, lines } = req.body as {
    supplierId: string;
    paymentTerms: string;
    lines: { productCode: string; quantity: number; unitCost: string }[];
  };

  const totalCost = lines
    .reduce((sum, l) => sum + Number(l.unitCost) * l.quantity, 0)
    .toFixed(2);

  const [po] = await db
    .insert(purchaseOrders)
    .values({ supplierId, paymentTerms, totalCost, status: 'DRAFT' })
    .returning();

  await db.insert(purchaseOrderLines).values(
    lines.map((l) => ({
      poId: po.id,
      productCode: l.productCode,
      quantity: l.quantity,
      unitCost: l.unitCost,
    }))
  );

  res.status(201).json(ok(po));
}

export async function approvePurchaseOrder(req: Request, res: Response) {
  const [po] = await db
    .update(purchaseOrders)
    .set({ status: 'APPROVED' })
    .where(eq(purchaseOrders.id, req.params.id))
    .returning();

  if (!po) return res.status(404).json(fail('PO not found'));

  const lines = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.poId, po.id));

  await publishPurchaseOrderApproved({
    purchaseOrderId: po.id,
    supplierId: po.supplierId,
    totalCost: po.totalCost,
    paymentTerms: po.paymentTerms,
    lines: lines.map((line) => ({
      productCode: line.productCode,
      quantity: line.quantity,
      unitCost: line.unitCost,
    })),
  });

  res.json(ok(po));
}