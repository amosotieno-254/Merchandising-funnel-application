// Generates a short, human-friendly PO identifier.
// Format: PO-XXXX where X is an uppercase letter or digit.
export function generatePurchaseOrderDisplayId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PO-${code}`;
}
