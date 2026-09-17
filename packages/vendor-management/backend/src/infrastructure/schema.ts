import { pgTable, uuid, text, numeric, timestamp, integer } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  contactEmail: text('contact_email').notNull(),
  paymentTerms: text('payment_terms').notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supplierProducts = pgTable('supplier_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }),
  productCode: text('product_code').notNull(),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull(),
});