import { eq } from 'drizzle-orm';
import { database } from '../infrastructure/db.js';
import { registerSessions, registerClosures } from '../infrastructure/schema.js';

export const repository = {
  listRegisterSessions() {
    return database.select().from(registerSessions);
  },

  findRegisterSessionById(sessionId: string) {
    return database
      .select()
      .from(registerSessions)
      .where(eq(registerSessions.id, sessionId));
  },

  findRegisterSessionByDisplayId(displayId: string) {
    return database
      .select()
      .from(registerSessions)
      .where(eq(registerSessions.displayId, displayId));
  },

  insertRegisterSession(values: {
    displayId: string;
    storeName: string;
    registerName: string;
    cashierName: string;
  }) {
    return database.insert(registerSessions).values(values).returning();
  },

  updateRegisterSession(
    sessionId: string,
    values: Partial<{
      expectedTotal: string;
      actualTotal: string;
      difference: string;
      explanation: string | null;
      closedAt: Date;
      status: string;
    }>
  ) {
    return database
      .update(registerSessions)
      .set(values)
      .where(eq(registerSessions.id, sessionId))
      .returning();
  },

  listRegisterClosures() {
    return database.select().from(registerClosures);
  },

  insertRegisterClosure(values: {
    registerSessionId: string;
    managerName: string;
    notes: string | null;
  }) {
    return database.insert(registerClosures).values(values).returning();
  },
};