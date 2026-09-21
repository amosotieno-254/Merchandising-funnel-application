import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import { suppliers, supplierProducts } from '../infrastructure/schema.js';
import { ok, fail } from '@mms/shared';

export async function listSuppliers(_req: Request, res: Response) {
  const rows = await db.select().from(suppliers);
  res.json(ok(rows));
}

export async function getSupplier(req: Request, res: Response) {
  const [row] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, req.params.id));

  if (!row) return res.status(404).json(fail('Supplier not found'));
  res.json(ok(row));
}

export async function createSupplier(req: Request, res: Response) {
  const [row] = await db.insert(suppliers).values(req.body).returning();
  res.status(201).json(ok(row));
}

export async function addSupplierProduct(req: Request, res: Response) {
  const [row] = await db
    .insert(supplierProducts)
    .values({ supplierId: req.params.id, ...req.body })
    .returning();
  res.status(201).json(ok(row));
}

export async function listSupplierProducts(req: Request, res: Response) {
  const rows = await db
    .select()
    .from(supplierProducts)
    .where(eq(supplierProducts.supplierId, req.params.id));
  res.json(ok(rows));
}