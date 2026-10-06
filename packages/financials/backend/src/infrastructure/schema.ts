import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: text('reference').notNull(),
  entryType: text('entry_type').notNull(),
  memo: text('memo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const journalLines = pgTable('journal_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').references(
    () => journalEntries.id,
    { onDelete: 'cascade' }
  ),
  account: text('account').notNull(),
  debit: numeric('debit', { precision: 14, scale: 2 }).notNull().default('0'),
  credit: numeric('credit', { precision: 14, scale: 2 }).notNull().default('0'),
});

export const accountsPayable = pgTable('accounts_payable', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: text('supplier_id').notNull(),
  reference: text('reference').notNull(),
  amountOwed: numeric('amount_owed', { precision: 14, scale: 2 }).notNull(),
  paymentTerms: text('payment_terms').notNull(),
  dueDate: date('due_date').notNull(),
  status: text('status').notNull().default('OUTSTANDING'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});