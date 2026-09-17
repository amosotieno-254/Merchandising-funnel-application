import { pgTable, uuid, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').notNull(),
  status: text('status').notNull().default('DRAFT'),
  paymentTerms: text('payment_terms').notNull(),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  poId: uuid('po_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productCode: text('product_code').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull(),
  receivedQuantity: integer('received_quantity').notNull().default(0),
});