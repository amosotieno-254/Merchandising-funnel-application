import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listJournalEntries(
  _request: Request,
  response: Response
) {
  try {
    response.json(ok(await service.listJournalEntries()));
  } catch (error) {
    console.error('listJournalEntries failed:', error);
    response.status(500).json(fail('Could not load journal entries'));
  }
}

export async function listJournalLines(_request: Request, response: Response) {
  try {
    response.json(ok(await service.listJournalLines()));
  } catch (error) {
    console.error('listJournalLines failed:', error);
    response.status(500).json(fail('Could not load journal lines'));
  }
}

export async function listAccountsPayable(
  _request: Request,
  response: Response
) {
  try {
    response.json(ok(await service.listAccountsPayable()));
  } catch (error) {
    console.error('listAccountsPayable failed:', error);
    response.status(500).json(fail('Could not load accounts payable'));
  }
}
