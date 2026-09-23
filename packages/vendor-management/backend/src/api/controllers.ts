import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listSuppliers(_req: Request, res: Response) {
  res.json(ok(await service.listSuppliers()));
}

export async function getSupplier(req: Request, res: Response) {
  const supplier = await service.getSupplierById(req.params.id);
  if (!supplier) return res.status(404).json(fail('Supplier not found'));
  res.json(ok(supplier));
}

export async function createSupplier(req: Request, res: Response) {
  const created = await service.createSupplier(req.body);
  res.status(201).json(ok(created));
}

export async function listSupplierProducts(req: Request, res: Response) {
  res.json(ok(await service.listSupplierProducts(req.params.id)));
}

export async function addSupplierProduct(req: Request, res: Response) {
  const created = await service.addSupplierProduct({
    supplierId: req.params.id,
    productCode: req.body.productCode,
    unitCost: req.body.unitCost,
  });
  res.status(201).json(ok(created));
}