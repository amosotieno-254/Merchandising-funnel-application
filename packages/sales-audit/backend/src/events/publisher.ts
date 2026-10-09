import { publishEvent } from '@mms/shared';

export interface DayClosedPayload {
  registerSessionId: string;
  storeName: string;
  registerName: string;
  expectedTotal: string;
  actualTotal: string;
  difference: string;
}

export async function publishDayClosed(payload: DayClosedPayload) {
  await publishEvent('day.closed', {
    eventId: crypto.randomUUID(),
    eventType: 'DayClosed',
    occurredAt: new Date().toISOString(),
    payload,
  });
}