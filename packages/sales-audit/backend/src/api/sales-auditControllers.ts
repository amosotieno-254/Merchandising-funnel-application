import type { Request, Response } from 'express';
import { ok, fail } from '@mms/shared';
import { service } from './service.js';

export async function listRegisterSessions(_request: Request, response: Response) {
  try {
    response.json(ok(await service.listRegisterSessions()));
  } catch (error) {
    console.error('listRegisterSessions failed:', error);
    response.status(500).json(fail('Could not load register sessions'));
  }
}

export async function listRegisterClosures(_request: Request, response: Response) {
  try {
    response.json(ok(await service.listRegisterClosures()));
  } catch (error) {
    console.error('listRegisterClosures failed:', error);
    response.status(500).json(fail('Could not load register closures'));
  }
}

export async function getRegisterSession(request: Request, response: Response) {
  try {
    const session = await service.getRegisterSessionWithClosure(request.params.id);
    if (!session) return response.status(404).json(fail('Register session not found'));
    response.json(ok(session));
  } catch (error) {
    console.error('getRegisterSession failed:', error);
    response.status(500).json(fail('Could not load register session'));
  }
}

export async function openRegister(request: Request, response: Response) {
  try {
    const created = await service.openRegister(request.body);
    response.status(201).json(ok(created));
  } catch (error) {
    console.error('openRegister failed:', error);
    response.status(500).json(fail('Could not open register'));
  }
}

export async function closeRegister(request: Request, response: Response) {
  try {
    const closed = await service.closeRegister({
      sessionId: request.params.id,
      actualTotal: request.body.actualTotal,
      managerName: request.body.managerName,
      explanation: request.body.explanation,
    });
    if (!closed) return response.status(404).json(fail('Register session not found'));
    response.json(ok(closed));
  } catch (error) {
    console.error('closeRegister failed:', error);
    response.status(500).json(fail('Could not close register'));
  }
}
