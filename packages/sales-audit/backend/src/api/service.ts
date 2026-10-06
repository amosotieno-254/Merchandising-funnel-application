import { repository } from './repository.js';
import { publishDayClosed } from '../events/publisher.js';

function generateRegisterDisplayId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `REG-${code}`;
}

export const service = {
  listRegisterSessions() {
    return repository.listRegisterSessions();
  },

  listRegisterClosures() {
    return repository.listRegisterClosures();
  },

  async getRegisterSessionWithClosure(sessionId: string) {
    const [session] = await repository.findRegisterSessionById(sessionId);
    if (!session) return null;
    return session;
  },

  async openRegister(input: {
    storeName: string;
    registerName: string;
    cashierName: string;
  }) {
    const [created] = await repository.insertRegisterSession({
      displayId: generateRegisterDisplayId(),
      storeName: input.storeName,
      registerName: input.registerName,
      cashierName: input.cashierName,
    });
    return created;
  },

  async closeRegister(input: {
    sessionId: string;
    actualTotal: string;
    managerName: string;
    explanation?: string;
  }) {
    const [session] = await repository.findRegisterSessionById(input.sessionId);
    if (!session) return null;

    const expected = Number(session.expectedTotal);
    const actual = Number(input.actualTotal);
    const difference = (actual - expected).toFixed(2);

    const [updated] = await repository.updateRegisterSession(session.id, {
      actualTotal: input.actualTotal,
      difference,
      explanation: input.explanation ?? null,
      closedAt: new Date(),
      status: 'CLOSED',
    });

    await repository.insertRegisterClosure({
      registerSessionId: session.id,
      managerName: input.managerName,
      notes: input.explanation ?? null,
    });

    await publishDayClosed({
      registerSessionId: session.id,
      storeName: session.storeName,
      registerName: session.registerName,
      expectedTotal: session.expectedTotal,
      actualTotal: input.actualTotal,
      difference,
    });

    return updated;
  },

  async recordSale(payload: {
    registerDisplayId: string;
    amount: string;
  }) {
    const [session] = await repository.findRegisterSessionByDisplayId(
      payload.registerDisplayId
    );
    if (!session) return;

    const newExpected = (
      Number(session.expectedTotal) + Number(payload.amount)
    ).toFixed(2);

    await repository.updateRegisterSession(session.id, {
      expectedTotal: newExpected,
    });
  },
};