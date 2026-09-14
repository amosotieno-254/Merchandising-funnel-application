export interface PurchaseOrderApprovedEvent {
  eventId: string;
  eventType: 'PurchaseOrderApproved';
  occurredAt: string;
  payload: {
    purchaseOrderId: string;
    supplierId: string;
    totalCost: string;
    paymentTerms: string;
    lines: Array<{
      productCode: string;
      quantity: number;
      unitCost: string;
    }>;
  };
}