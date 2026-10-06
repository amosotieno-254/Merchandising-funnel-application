import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import { sales, saleLines } from '../infrastructure/schema.js';

export const repository = {
  listSales() {
    return db.select().from(sales);
  },

  findSaleById(saleId: string) {
    return db.select().from(sales).where(eq(sales.id, saleId));
  },

  findLinesBySaleId(saleId: string) {
    return db.select().from(saleLines).where(eq(saleLines.saleId, saleId));
  },

  insertSale(values: {
    registerId: string;
    storeId: string;
    cashierId: string;
    totalAmount: string;
    paymentMethod: string;
    status: string;
  }) {
    return db.insert(sales).values(values).returning();
  },

  insertSaleLines(
    values: Array<{
      saleId: string;
      productCode: string;
      quantity: number;
      unitPrice: string;
      discount: string;
      lineTotal: string;
    }>
  ) {
    return db.insert(saleLines).values(values).returning();
  },
};