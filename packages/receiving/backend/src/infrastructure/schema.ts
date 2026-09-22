import { clear } from 'console';
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const expectedDeliveries = pgTable('expected_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  paymentTerms: text('payment_terms').notNull(),
  lines: text('lines').notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
});

export const goodsReceivedNotes = pgTable('goods_received_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').notNull(),
  supplierId: uuid('supplier_id').notNull(),
  status: text('status').notNull().default('COMPLETE'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const goodsReceivedNoteLines = pgTable('goods_received_note_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  goodsReceivedNoteId: uuid('goods_received_note_id').references(
    () => goodsReceivedNotes.id,
    { onDelete: 'cascade' }
  ),
  productCode: text('product_code').notNull(),
  orderedQuantity: integer('ordered_quantity').notNull(),
  receivedQuantity: integer('received_quantity').notNull(),
  condition: text('condition').notNull().default('GOOD'),
});