import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import { purchaseOrders, purchaseOrderLines } from '../infrastructure/schema.js';

export const repository = {
  // Purchase orders
  listPurchaseOrders() {
    return db.select().from(purchaseOrders);
  },

  findPurchaseOrderById(purchaseOrderId: string) {
    return db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId));
  },

  insertPurchaseOrder(values: {
    supplierId: string;
    paymentTerms: string;
    totalCost: string;
    status: string;
  }) {
    return db.insert(purchaseOrders).values(values).returning();
  },

  updatePurchaseOrderStatus(purchaseOrderId: string, status: string) {
    return db
      .update(purchaseOrders)
      .set({ status })
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .returning();
  },

  // Purchase order lines
  findLinesByPurchaseOrderId(purchaseOrderId: string) {
    return db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.poId, purchaseOrderId));
  },

  insertPurchaseOrderLines(
    values: Array<{
      poId: string;
      productCode: string;
      quantity: number;
      unitCost: string;
    }>
  ) {
    return db.insert(purchaseOrderLines).values(values).returning();
  },
};