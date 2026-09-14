import { Router } from 'express';
import { db } from '../infrastructure/db.js';
import { purchaseOrders, purchaseOrderLines } from '../infrastructure/schema.js';
import { eq } from 'drizzle-orm';
import { ok, fail } from '@mms/shared';

export const procurementRouter = Router();

procurementRouter.post('/purchase-orders', async (req, res) => {
  const { supplierId, paymentTerms, lines } = req.body;

  const totalCost = lines
    .reduce((sum: number, l: any) => sum + Number(l.unitCost) * l.quantity, 0)
    .toFixed(2);

  const [po] = await db
    .insert(purchaseOrders)
    .values({ supplierId, paymentTerms, totalCost, status: 'DRAFT' })
    .returning();

  await db.insert(purchaseOrderLines).values(
    lines.map((l: any) => ({
      poId: po.id,
      productCode: l.productCode,
      quantity: l.quantity,
      unitCost: l.unitCost,
    }))
  );

  res.status(201).json(ok(po));
});

procurementRouter.post('/purchase-orders/:id/approve', async (req, res) => {
  const [po] = await db
    .update(purchaseOrders)
    .set({ status: 'APPROVED' })
    .where(eq(purchaseOrders.id, req.params.id))
    .returning();

  if (!po) return res.status(404).json(fail('PO not found'));
  res.json(ok(po));
});

procurementRouter.get('/purchase-orders', async (_req, res) => {
  res.json(ok(await db.select().from(purchaseOrders)));
});

procurementRouter.get('/purchase-orders/:id', async (req, res) => {
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
});