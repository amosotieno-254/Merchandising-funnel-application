import { database } from '../infrastructure/db.js';
import {
  journalEntries,
  journalLines,
  accountsPayable,
} from '../infrastructure/schema.js';

export const repository = {
  listJournalEntries() {
    return database.select().from(journalEntries);
  },

  listJournalLines() {
    return database.select().from(journalLines);
  },

  listAccountsPayable() {
    return database.select().from(accountsPayable);
  },

  insertJournalEntry(values: {
    reference: string;
    entryType: string;
    memo: string;
  }) {
    return database.insert(journalEntries).values(values).returning();
  },

  insertJournalLines(
    values: Array<{
      journalEntryId: string;
      account: string;
      debit: string;
      credit: string;
    }>
  ) {
    return database.insert(journalLines).values(values).returning();
  },

  insertAccountPayable(values: {
    supplierId: string;
    reference: string;
    amountOwed: string;
    paymentTerms: string;
    dueDate: string;
  }) {
    return database.insert(accountsPayable).values(values).returning();
  },
};