import { subscribeEvent } from '@mms/shared';
import { service } from '../api/service.js';

export async function startSubscribers() {
  await subscribeEvent(
    'goods.received',
    async (event) => {
      await service.recordGoodsReceived(event.payload);
    },
    'financials.goods-received'
  );

  await subscribeEvent(
    'item.sold',
    async (event) => {
      await service.recordItemSold(event.payload);
    },
    'financials.item-sold'
  );

  await subscribeEvent(
    'day.closed',
    async (event) => {
      await service.recordDayClosed(event.payload);
    },
    'financials.day-closed'
  );
}