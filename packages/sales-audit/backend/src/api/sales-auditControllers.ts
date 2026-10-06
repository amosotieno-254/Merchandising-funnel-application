import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listRegisterSessions(_request: Request, response: Response) {
  response.json(ok(await service.listRegisterSessions()));
}

export async function listRegisterClosures(_request: Request, response: Response) {
  response.json(ok(await service.listRegisterClosures()));
}

export async function getRegisterSession(request: Request, response: Response) {
  const session = await service.getRegisterSessionWithClosure(request.params.id);
  if (!session) return response.status(404).json(fail('Register session not found'));
  response.json(ok(session));
}

export async function openRegister(request: Request, response: Response) {
  const created = await service.openRegister(request.body);
  response.status(201).json(ok(created));
}

export async function closeRegister(request: Request, response: Response) {
  const closed = await service.closeRegister({
    sessionId: request.params.id,
    actualTotal: request.body.actualTotal,
    managerName: request.body.managerName,
    explanation: request.body.explanation,
  });
  if (!closed) return response.status(404).json(fail('Register session not found'));
  response.json(ok(closed));
}