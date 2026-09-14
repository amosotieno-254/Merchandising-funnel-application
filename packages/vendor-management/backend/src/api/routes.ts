import { Router } from 'express';
import { db } from '../infrastructure/db.js';
import { suppliers, supplierProducts } from '../infrastructure/schema.js';
import { eq } from 'drizzle-orm';
import { ok, fail } from '@mms/shared';

export const vendorRouter = Router();

vendorRouter.get('/suppliers', async (_req, res) => {
  const rows = await db.select().from(suppliers);
  res.json(ok(rows));
});

vendorRouter.get('/suppliers/:id', async (req, res) => {
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, req.params.id));
  if (!row) return res.status(404).json(fail('Supplier not found'));
  res.json(ok(row));
});

vendorRouter.post('/suppliers', async (req, res) => {
  const [row] = await db.insert(suppliers).values(req.body).returning();
  res.status(201).json(ok(row));
});

vendorRouter.post('/suppliers/:id/products', async (req, res) => {
  const [row] = await db
    .insert(supplierProducts)
    .values({ supplierId: req.params.id, ...req.body })
    .returning();
  res.status(201).json(ok(row));
});

vendorRouter.get('/suppliers/:id/products', async (req, res) => {
  const rows = await db
    .select()
    .from(supplierProducts)
    .where(eq(supplierProducts.supplierId, req.params.id));
  res.json(ok(rows));
});