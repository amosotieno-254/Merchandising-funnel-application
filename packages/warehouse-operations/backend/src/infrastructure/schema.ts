import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const storageBins = pgTable('storage_bins', {
  id: uuid('id').primaryKey().defaultRandom(),
  binCode: text('bin_code').notNull(),
  zone: text('zone').notNull(),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const putawayTasks = pgTable('putaway_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  productCode: text('product_code').notNull(),
  quantity: integer('quantity').notNull(),
  assignedBinId: uuid('assigned_bin_id').references(() => storageBins.id),
  status: text('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pickTasks = pgTable('pick_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  productCode: text('product_code').notNull(),
  quantity: integer('quantity').notNull(),
  fromBinId: uuid('from_bin_id').references(() => storageBins.id),
  status: text('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockTransfers = pgTable('stock_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productCode: text('product_code').notNull(),
  fromLocation: text('from_location').notNull(),
  toLocation: text('to_location').notNull(),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});