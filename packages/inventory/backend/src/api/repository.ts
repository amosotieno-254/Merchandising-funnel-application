import { and, eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import { stock } from '../infrastructure/schema.js';

export const repository = {
  listStock() {
    return db.select().from(stock);
  },

  findStockByProductAndLocation(productCode: string, location: string) {
    return db
      .select()
      .from(stock)
      .where(and(eq(stock.productCode, productCode), eq(stock.location, location)));
  },

  insertStock(values: {
    productCode: string;
    location: string;
    onHand: number;
    unitCost: string;
  }) {
    return db.insert(stock).values(values).returning();
  },

  updateStock(
    stockId: string,
    values: {
      onHand?: number;
      unitCost?: string;
      updatedAt: Date;
    }
  ) {
    return db
      .update(stock)
      .set(values)
      .where(eq(stock.id, stockId))
      .returning();
  },
};