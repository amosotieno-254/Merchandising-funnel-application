import { repository } from './repository.js';

export const service = {
  listStock() {
    return repository.listStock();
  },

  async getAvailableQuantity(productCode: string, location: string) {
    const [row] = await repository.findStockByProductAndLocation(
      productCode,
      location
    );

    if (!row) {
      return 0;
    }

    return row.onHand - row.allocated;
  },

  async receiveStock(input: {
    productCode: string;
    location: string;
    quantity: number;
    unitCost: string;
  }) {
    const [existing] = await repository.findStockByProductAndLocation(
      input.productCode,
      input.location
    );

    if (existing) {
      const [updated] = await repository.updateStock(existing.id, {
        onHand: existing.onHand + input.quantity,
        unitCost: input.unitCost,
        updatedAt: new Date(),
      });
      return updated;
    }

    const [created] = await repository.insertStock({
      productCode: input.productCode,
      location: input.location,
      onHand: input.quantity,
      unitCost: input.unitCost,
    });
    return created;
  },

  async sellStock(input: {
    productCode: string;
    location: string;
    quantity: number;
  }) {
    const [existing] = await repository.findStockByProductAndLocation(
      input.productCode,
      input.location
    );

    if (!existing || existing.onHand < input.quantity) {
      return { error: 'Insufficient stock' as const };
    }

    const [updated] = await repository.updateStock(existing.id, {
      onHand: existing.onHand - input.quantity,
      updatedAt: new Date(),
    });

    return { data: updated };
  },
};