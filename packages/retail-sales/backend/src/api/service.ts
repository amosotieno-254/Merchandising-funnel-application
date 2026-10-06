import { repository } from './repository.js';
import { publishItemSold } from '../events/publisher.js';
import { checkAvailability } from '../grpc/inventoryClient.js';

export const service = {
  listSales() {
    return repository.listSales();
  },

  async getSaleWithLines(saleId: string) {
    const [sale] = await repository.findSaleById(saleId);
    if (!sale) return null;

    const lines = await repository.findLinesBySaleId(sale.id);
    return { ...sale, lines };
  },

  async createSale(input: {
    registerId: string;
    storeId: string;
    cashierId: string;
    paymentMethod: string;
    location: string;
    lines: Array<{
      productCode: string;
      quantity: number;
      unitPrice: string;
      discount?: string;
    }>;
  }) {
    for (const line of input.lines) {
      const availability = await checkAvailability(
        line.productCode,
        input.location,
        line.quantity
      );

      if (!availability.available) {
        return {
          error: `Insufficient stock for ${line.productCode} at ${input.location}: requested ${line.quantity}, available ${availability.onHand - availability.allocated}`,
        };
      }
    }

    const enrichedLines = input.lines.map((line) => {
      const discount = line.discount ?? '0.00';
      const lineTotal = (
        Number(line.unitPrice) * line.quantity - Number(discount)
      ).toFixed(2);

      return {
        productCode: line.productCode,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount,
        lineTotal,
      };
    });

    const totalAmount = enrichedLines
      .reduce((sum, line) => sum + Number(line.lineTotal), 0)
      .toFixed(2);

    const [sale] = await repository.insertSale({
      registerId: input.registerId,
      storeId: input.storeId,
      cashierId: input.cashierId,
      totalAmount,
      paymentMethod: input.paymentMethod,
      status: 'COMPLETED',
    });

    await repository.insertSaleLines(
      enrichedLines.map((line) => ({ saleId: sale.id, ...line }))
    );

    await publishItemSold({
      saleId: sale.id,
      registerId: sale.registerId,
      storeId: sale.storeId,
      cashierId: sale.cashierId,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      lines: enrichedLines,
    });

    return { data: sale };
  },
};