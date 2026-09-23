import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import { suppliers, supplierProducts } from '../infrastructure/schema.js';

export const repository = {
  // Suppliers
  listSuppliers() {
    return db.select().from(suppliers);
  },

  findSupplierById(supplierId: string) {
    return db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId));
  },

  insertSupplier(values: {
    name: string;
    contactEmail: string;
    paymentTerms: string;
    leadTimeDays: number;
  }) {
    return db.insert(suppliers).values(values).returning();
  },

  // Supplier products
  listSupplierProducts(supplierId: string) {
    return db
      .select()
      .from(supplierProducts)
      .where(eq(supplierProducts.supplierId, supplierId));
  },

  insertSupplierProduct(values: {
    supplierId: string;
    productCode: string;
    unitCost: string;
  }) {
    return db.insert(supplierProducts).values(values).returning();
  },
};