import { subscribeEvent } from '@mms/shared';
import { service } from '../api/service.js';

export async function startSubscribers() {
  await subscribeEvent(
    'item.sold',
    async (event) => {
      await service.recordSale(event.payload);
    },
    'sales-audit.item-sold'
  );
}