import { publishEvent } from '@mms/shared';

export interface GoodsReceivedPayload {
  goodsReceivedNoteId: string;
  purchaseOrderId: string;
  supplierId: string;
  lines: Array<{
    productCode: string;
    receivedQuantity: number;
    condition: 'GOOD' | 'DAMAGED';
  }>;
}

export async function publishGoodsReceived(payload: GoodsReceivedPayload) {
  await publishEvent('goods.received', {
    eventId: crypto.randomUUID(),
    eventType: 'GoodsReceived',
    occurredAt: new Date().toISOString(),
    payload,
  });
}