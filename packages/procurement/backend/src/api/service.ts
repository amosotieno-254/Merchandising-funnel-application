import { repository } from './repository.js';
import { publishPurchaseOrderApproved } from '../events/publisher.js';

export const service = {
  listPurchaseOrders() {
    return repository.listPurchaseOrders();
  },

  async getPurchaseOrderWithLines(purchaseOrderId: string) {
    const [po] = await repository.findPurchaseOrderById(purchaseOrderId);
    if (!po) return null;

    const lines = await repository.findLinesByPurchaseOrderId(po.id);
    return { ...po, lines };
  },

  async createPurchaseOrder(input: {
    supplierId: string;
    paymentTerms: string;
    lines: Array<{
      productCode: string;
      quantity: number;
      unitCost: string;
    }>;
  }) {
    const totalCost = input.lines
      .reduce((sum, line) => sum + Number(line.unitCost) * line.quantity, 0)
      .toFixed(2);

    const [po] = await repository.insertPurchaseOrder({
      supplierId: input.supplierId,
      paymentTerms: input.paymentTerms,
      totalCost,
      status: 'DRAFT',
    });

    await repository.insertPurchaseOrderLines(
      input.lines.map((line) => ({
        poId: po.id,
        productCode: line.productCode,
        quantity: line.quantity,
        unitCost: line.unitCost,
      }))
    );

    return po;
  },

  async approvePurchaseOrder(purchaseOrderId: string) {
    const [approved] = await repository.updatePurchaseOrderStatus(
      purchaseOrderId,
      'APPROVED'
    );

    if (!approved) return null;

    const lines = await repository.findLinesByPurchaseOrderId(approved.id);

    await publishPurchaseOrderApproved({
      purchaseOrderId: approved.id,
      supplierId: approved.supplierId,
      totalCost: approved.totalCost,
      paymentTerms: approved.paymentTerms,
      lines: lines.map((line) => ({
        productCode: line.productCode,
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
    });

    return approved;
  },
};