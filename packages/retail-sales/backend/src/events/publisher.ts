import { publishEvent } from '@mms/shared';

export interface ItemSoldPayload {
  saleId: string;
  registerId: string;
  storeId: string;
  cashierId: string;
  totalAmount: string;
  paymentMethod: string;
  lines: Array<{
    productCode: string;
    quantity: number;
    unitPrice: string;
    discount: string;
    lineTotal: string;
  }>;
}

export async function publishItemSold(payload: ItemSoldPayload) {
  await publishEvent('item.sold', {
    eventId: crypto.randomUUID(),
    eventType: 'ItemSold',
    occurredAt: new Date().toISOString(),
    payload,
  });
}