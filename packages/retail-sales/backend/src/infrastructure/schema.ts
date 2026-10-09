import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  registerId: text('register_id').notNull(),
  storeId: text('store_id').notNull(),
  cashierId: text('cashier_id').notNull(),
  totalAmount: text('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').notNull().default('COMPLETED'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const saleLines = pgTable('sale_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'cascade' }),
  productCode: text('product_code').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: text('unit_price').notNull(),
  discount: text('discount').notNull().default('0.00'),
  lineTotal: text('line_total').notNull(),
});