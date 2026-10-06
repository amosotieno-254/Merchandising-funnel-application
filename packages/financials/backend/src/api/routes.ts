import { Router } from 'express';
import {
  listJournalEntries,
  listJournalLines,
  listAccountsPayable,
} from './financialControllers.js';

export const financialsRouter = Router();

financialsRouter.get('/journal-entries', listJournalEntries);
financialsRouter.get('/journal-lines', listJournalLines);
financialsRouter.get('/accounts-payable', listAccountsPayable);