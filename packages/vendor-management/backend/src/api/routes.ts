import { Router } from 'express';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  addSupplierProduct,
  listSupplierProducts,
} from './vendorControllers.js';

export const vendorRouter = Router();

vendorRouter.get('/suppliers', listSuppliers);
vendorRouter.get('/suppliers/:id', getSupplier);
vendorRouter.post('/suppliers', createSupplier);
vendorRouter.post('/suppliers/:id/products', addSupplierProduct);
vendorRouter.get('/suppliers/:id/products', listSupplierProducts);