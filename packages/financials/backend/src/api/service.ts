import { repository } from './repository.js';

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

function paymentTermsToDays(terms: string): number {
  const match = terms.match(/(\d+)/);
  if (!match) return 0;
  return Number(match[1]);
}

export const service = {
  listJournalEntries() {
    return repository.listJournalEntries();
  },

  listJournalLines() {
    return repository.listJournalLines();
  },

  listAccountsPayable() {
    return repository.listAccountsPayable();
  },

  async recordGoodsReceived(payload: {
    goodsReceivedNoteId: string;
    supplierId: string;
    lines: Array<{ productCode: string; receivedQuantity: number }>;
  }) {
    const totalValue = (
      payload.lines.reduce(
        (sum, line) => sum + line.receivedQuantity * 10,
        0
      )
    ).toFixed(2);

    const [entry] = await repository.insertJournalEntry({
      reference: payload.goodsReceivedNoteId,
      entryType: 'GOODS_RECEIVED',
      memo: `Goods received for GRN ${payload.goodsReceivedNoteId}`,
    });

    await repository.insertJournalLines([
      {
        journalEntryId: entry.id,
        account: 'Inventory Asset',
        debit: totalValue,
        credit: '0.00',
      },
      {
        journalEntryId: entry.id,
        account: 'Accounts Payable',
        debit: '0.00',
        credit: totalValue,
      },
    ]);

    const dueDate = addDays(new Date(), paymentTermsToDays('Net 30'));

    await repository.insertAccountPayable({
      supplierId: payload.supplierId,
      reference: payload.goodsReceivedNoteId,
      amountOwed: totalValue,
      paymentTerms: 'Net 30',
      dueDate,
    });
  },

  async recordItemSold(payload: {
    saleId: string;
    totalAmount: string;
    lines: Array<{ productCode: string; quantity: number; unitPrice: string }>;
  }) {
    const revenue = Number(payload.totalAmount).toFixed(2);
    const costOfGoodsSold = (Number(revenue) * 0.4).toFixed(2);

    const [entry] = await repository.insertJournalEntry({
      reference: payload.saleId,
      entryType: 'ITEM_SOLD',
      memo: `Sale recorded for ${payload.saleId}`,
    });

    await repository.insertJournalLines([
      {
        journalEntryId: entry.id,
        account: 'Cost of Goods Sold',
        debit: costOfGoodsSold,
        credit: '0.00',
      },
      {
        journalEntryId: entry.id,
        account: 'Inventory Asset',
        debit: '0.00',
        credit: costOfGoodsSold,
      },
      {
        journalEntryId: entry.id,
        account: 'Revenue',
        debit: '0.00',
        credit: revenue,
      },
      {
        journalEntryId: entry.id,
        account: 'Cash',
        debit: revenue,
        credit: '0.00',
      },
    ]);
  },

  async recordDayClosed(payload: {
    registerSessionId: string;
    difference: string;
    storeName: string;
    registerName: string;
  }) {
    const difference = Number(payload.difference);

    if (difference === 0) {
      return;
    }

    const amount = Math.abs(difference).toFixed(2);
    const isShort = difference < 0;

    const [entry] = await repository.insertJournalEntry({
      reference: payload.registerSessionId,
      entryType: 'CASH_OVER_SHORT',
      memo: `Cash ${isShort ? 'shortage' : 'overage'} at ${payload.storeName} / ${payload.registerName}`,
    });

    await repository.insertJournalLines([
      {
        journalEntryId: entry.id,
        account: isShort ? 'Cash Over/Short Expense' : 'Cash',
        debit: isShort ? amount : '0.00',
        credit: isShort ? '0.00' : amount,
      },
      {
        journalEntryId: entry.id,
        account: isShort ? 'Cash' : 'Cash Over/Short Expense',
        debit: isShort ? '0.00' : amount,
        credit: isShort ? amount : '0.00',
      },
    ]);
  },
};