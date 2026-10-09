export interface DayClosedPayload {
  registerSessionId: string;
  storeName: string;
  registerName: string;
  expectedTotal: string;
  actualTotal: string;
  difference: string;
}