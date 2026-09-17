import { pgTable, uuid, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';

export const stock = pgTable('stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  productCode: text('product_code').notNull(),
  location: text('location').notNull(),
  onHand: integer('on_hand').notNull().default(0),
  allocated: integer('allocated').notNull().default(0),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});