export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function fail(error: string): ApiResponse<never> {
  return { success: false, error };
}

export { publishEvent, subscribeEvent, EXCHANGE } from './event-bus.js';