import { publishEvent } from '@mms/shared';

export interface PutawayTaskCreatedPayload {
  putawayTaskId: string;
  productCode: string;
  quantity: number;
  assignedBinId: string | null;
}

export async function publishPutawayTaskCreated(
  payload: PutawayTaskCreatedPayload
) {
  await publishEvent('putaway.task.created', {
    eventId: crypto.randomUUID(),
    eventType: 'PutawayTaskCreated',
    occurredAt: new Date().toISOString(),
    payload,
  });
}