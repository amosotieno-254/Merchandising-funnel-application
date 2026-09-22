import { subscribeEvent } from '@mms/shared';
import { db } from '../infrastructure/db.js';
import { expectedDeliveries } from '../infrastructure/schema.js';

export async function startSubscribers() {
  await subscribeEvent(
    'purchase-order.approved',
    async (event: any) => {
      const p = event.payload;
      await db.insert(expectedDeliveries).values({
        purchaseOrderId: p.purchaseOrderId,
        supplierId: p.supplierId,
        paymentTerms: p.paymentTerms,
        lines: JSON.stringify(p.lines),
      });
      console.log('📦 Expected delivery recorded for PO', p.purchaseOrderId);
    },
    'receiving.expected-deliveries'
  );
}