import { eq } from 'drizzle-orm';
import { db } from '../infrastructure/db.js';
import {
  goodsReceivedNotes,
  goodsReceivedNoteLines,
  expectedDeliveries,
} from '../infrastructure/schema.js';

export const repository = {
  // Expected deliveries
  listExpectedDeliveries() {
    return db.select().from(expectedDeliveries);
  },

  insertExpectedDelivery(values: {
    purchaseOrderId: string;
    supplierId: string;
    paymentTerms: string;
    lines: string;
  }) {
    return db.insert(expectedDeliveries).values(values).returning();
  },

  // Goods received notes
  listGoodsReceivedNotes() {
    return db.select().from(goodsReceivedNotes);
  },

  findGoodsReceivedNoteById(noteId: string) {
    return db
      .select()
      .from(goodsReceivedNotes)
      .where(eq(goodsReceivedNotes.id, noteId));
  },

  findLinesByGoodsReceivedNoteId(noteId: string) {
    return db
      .select()
      .from(goodsReceivedNoteLines)
      .where(eq(goodsReceivedNoteLines.goodsReceivedNoteId, noteId));
  },

  insertGoodsReceivedNote(values: {
    purchaseOrderId: string;
    supplierId: string;
    status: string;
  }) {
    return db.insert(goodsReceivedNotes).values(values).returning();
  },

  insertGoodsReceivedNoteLines(
    values: Array<{
      goodsReceivedNoteId: string;
      productCode: string;
      orderedQuantity: number;
      receivedQuantity: number;
      condition: string;
    }>
  ) {
    return db.insert(goodsReceivedNoteLines).values(values).returning();
  },
};