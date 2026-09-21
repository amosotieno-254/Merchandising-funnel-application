/// <reference types="jest" />
import request from 'supertest';
import { ok, fail } from '@mms/shared';
import { app } from '../src/index.js';

describe('Inventory', () => {
  it('ok() wraps data with success=true', () => {
    expect(ok({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
  });

  it('fail() wraps errors with success=false', () => {
    expect(fail('boom')).toEqual({ success: false, error: 'boom' });
  });

  it('GET /api/v1/stock returns a success envelope', async () => {
    const res = await request(app).get('/api/v1/stock');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});