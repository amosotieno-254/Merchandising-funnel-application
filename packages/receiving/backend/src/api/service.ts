import { repository } from './repository.js';
import { publishGoodsReceived } from '../events/publisher.js';

export const service = {
  listExpectedDeliveries() {
    return repository.listExpectedDeliveries();
  },

  listGoodsReceivedNotes() {
    return repository.listGoodsReceivedNotes();
  },

  async getGoodsReceivedNoteWithLines(noteId: string) {
    const [note] = await repository.findGoodsReceivedNoteById(noteId);
    if (!note) return null;

    const lines = await repository.findLinesByGoodsReceivedNoteId(note.id);
    return { ...note, lines };
  },

  async createGoodsReceivedNote(input: {
    purchaseOrderId: string;
    supplierId: string;
    lines: Array<{
      productCode: string;
      orderedQuantity: number;
      receivedQuantity: number;
      condition?: 'GOOD' | 'DAMAGED';
    }>;
  }) {
    const isPartial = input.lines.some(
      (line) => line.receivedQuantity < line.orderedQuantity
    );

    const [note] = await repository.insertGoodsReceivedNote({
      purchaseOrderId: input.purchaseOrderId,
      supplierId: input.supplierId,
      status: isPartial ? 'PARTIAL' : 'COMPLETE',
    });

    await repository.insertGoodsReceivedNoteLines(
      input.lines.map((line) => ({
        goodsReceivedNoteId: note.id,
        productCode: line.productCode,
        orderedQuantity: line.orderedQuantity,
        receivedQuantity: line.receivedQuantity,
        condition: line.condition ?? 'GOOD',
      }))
    );

    await publishGoodsReceived({
      goodsReceivedNoteId: note.id,
      purchaseOrderId: input.purchaseOrderId,
      supplierId: input.supplierId,
      lines: input.lines.map((line) => ({
        productCode: line.productCode,
        receivedQuantity: line.receivedQuantity,
        condition: line.condition ?? 'GOOD',
      })),
    });

    return note;
  },

  async recordExpectedDelivery(payload: {
    purchaseOrderId: string;
    supplierId: string;
    paymentTerms: string;
    lines: unknown;
  }) {
    await repository.insertExpectedDelivery({
      purchaseOrderId: payload.purchaseOrderId,
      supplierId: payload.supplierId,
      paymentTerms: payload.paymentTerms,
      lines: JSON.stringify(payload.lines),
    });
  },
};