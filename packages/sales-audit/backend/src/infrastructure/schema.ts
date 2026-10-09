import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';

export const registerSessions = pgTable('register_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayId: text('display_id').notNull().unique(),
  storeName: text('store_name').notNull(),
  registerName: text('register_name').notNull(),
  cashierName: text('cashier_name').notNull(),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  status: text('status').notNull().default('OPEN'),
  expectedTotal: numeric('expected_total', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  actualTotal: numeric('actual_total', { precision: 12, scale: 2 }),
  difference: numeric('difference', { precision: 12, scale: 2 }),
  explanation: text('explanation'),
});

export const registerClosures = pgTable('register_closures', {
  id: uuid('id').primaryKey().defaultRandom(),
  registerSessionId: uuid('register_session_id').references(
    () => registerSessions.id,
    { onDelete: 'cascade' }
  ),
  managerName: text('manager_name').notNull(),
  signedOffAt: timestamp('signed_off_at').defaultNow().notNull(),
  notes: text('notes'),
});