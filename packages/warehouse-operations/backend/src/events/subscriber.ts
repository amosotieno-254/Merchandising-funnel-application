import { subscribeEvent } from '@mms/shared';
import { database } from '../infrastructure/db.js';
import { putawayTasks } from '../infrastructure/schema.js';

export async function startSubscribers() {
  await subscribeEvent(
    'goods.received',
    async (event) => {
      const receivedLines = event.payload.lines ?? [];

      for (const receivedLine of receivedLines) {
        await database.insert(putawayTasks).values({
          productCode: receivedLine.productCode,
          quantity: receivedLine.receivedQuantity,
          status: 'PENDING',
        });
      }

    
    },
    'warehouse.putaway-tasks'
  );
}