import type { Request, Response } from 'express';
import { ok } from '@mms/shared';
import { service } from './service.js';

export async function listJournalEntries(
  _request: Request,
  response: Response
) {
  response.json(ok(await service.listJournalEntries()));
}

export async function listJournalLines(_request: Request, response: Response) {
  response.json(ok(await service.listJournalLines()));
}

export async function listAccountsPayable(
  _request: Request,
  response: Response
) {
  response.json(ok(await service.listAccountsPayable()));
}