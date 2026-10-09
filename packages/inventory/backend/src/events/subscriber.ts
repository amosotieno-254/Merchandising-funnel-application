import { subscribeEvent } from '@mms/shared';
import { service } from '../api/service.js';

export async function startSubscribers() {
  await subscribeEvent(
    'item.sold',
    async (event) => {
      const lines = event.payload.lines ?? [];
      for (const line of lines) {
        await service.sellStock({
          productCode: line.productCode,
          location: 'MAIN_WAREHOUSE',
          quantity: line.quantity,
        });
      }
    },
    'inventory.item-sold'
  );
}