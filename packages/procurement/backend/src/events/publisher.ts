import { publishEvent } from '@mms/shared';

export interface PurchaseOrderApprovedPayload {
  purchaseOrderId: string;
  supplierId: string;
  totalCost: string;
  paymentTerms: string;
  lines: Array<{
    productCode: string;
    quantity: number;
    unitCost: string;
  }>;
}

export async function publishPurchaseOrderApproved(
  payload: PurchaseOrderApprovedPayload
) {
  await publishEvent('purchase-order.approved', {
    eventId: crypto.randomUUID(),
    eventType: 'PurchaseOrderApproved',
    occurredAt: new Date().toISOString(),
    payload,
  });
}
