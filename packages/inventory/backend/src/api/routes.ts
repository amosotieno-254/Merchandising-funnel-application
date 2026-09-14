import { Router } from 'express';
import { db } from '../infrastructure/db.js';
import { stock } from '../infrastructure/schema.js';
import { and, eq } from 'drizzle-orm';
import { ok, fail } from '@mms/shared';

export const inventoryRouter = Router();

inventoryRouter.get('/stock', async (_req, res) => {
  res.json(ok(await db.select().from(stock)));
});

inventoryRouter.get('/stock/:productCode/available', async (req, res) => {
  const location = req.query.location as string;
  const [row] = await db
    .select()
    .from(stock)
    .where(and(eq(stock.productCode, req.params.productCode), eq(stock.location, location)));

  if (!row) return res.json(ok({ available: 0 }));
  res.json(ok({ available: row.onHand - row.allocated }));
});

inventoryRouter.post('/stock/receive', async (req, res) => {
  const { productCode, location, quantity, unitCost } = req.body;

  const [existing] = await db
    .select()
    .from(stock)
    .where(and(eq(stock.productCode, productCode), eq(stock.location, location)));

  if (existing) {
    const [updated] = await db
      .update(stock)
      .set({
        onHand: existing.onHand + quantity,
        unitCost,
        updatedAt: new Date(),
      })
      .where(eq(stock.id, existing.id))
      .returning();
    return res.json(ok(updated));
  }

  const [created] = await db
    .insert(stock)
    .values({ productCode, location, onHand: quantity, unitCost })
    .returning();

  res.status(201).json(ok(created));
});

inventoryRouter.post('/stock/sell', async (req, res) => {
  const { productCode, location, quantity } = req.body;

  const [existing] = await db
    .select()
    .from(stock)
    .where(and(eq(stock.productCode, productCode), eq(stock.location, location)));

  if (!existing || existing.onHand < quantity) {
    return res.status(400).json(fail('Insufficient stock'));
  }

  const [updated] = await db
    .update(stock)
    .set({ onHand: existing.onHand - quantity, updatedAt: new Date() })
    .where(eq(stock.id, existing.id))
    .returning();

  res.json(ok(updated));
});