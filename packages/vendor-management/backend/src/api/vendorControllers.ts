import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listSuppliers(_req: Request, res: Response) {
  try {
    res.json(ok(await service.listSuppliers()));
  } catch (err) {
    console.error('listSuppliers failed:', err);
    res.status(500).json(fail('Could not load suppliers'));
  }
}

export async function getSupplier(req: Request, res: Response) {
  try {
    const supplier = await service.getSupplierById(req.params.id);
    if (!supplier) return res.status(404).json(fail('Supplier not found'));
    res.json(ok(supplier));
  } catch (err) {
    console.error('getSupplier failed:', err);
    res.status(500).json(fail('Could not load supplier'));
  }
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const created = await service.createSupplier(req.body);
    res.status(201).json(ok(created));
  } catch (err) {
    console.error('createSupplier failed:', err);
    res.status(500).json(fail('Could not create supplier'));
  }
}

export async function listSupplierProducts(req: Request, res: Response) {
  try {
    res.json(ok(await service.listSupplierProducts(req.params.id)));
  } catch (err) {
    console.error('listSupplierProducts failed:', err);
    res.status(500).json(fail('Could not load supplier products'));
  }
}

export async function addSupplierProduct(req: Request, res: Response) {
  try {
    const created = await service.addSupplierProduct({
      supplierId: req.params.id,
      productCode: req.body.productCode,
      unitCost: req.body.unitCost,
    });
    res.status(201).json(ok(created));
  } catch (err) {
    console.error('addSupplierProduct failed:', err);
    res.status(500).json(fail('Could not add supplier product'));
  }
}
