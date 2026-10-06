/// <reference types="jest" />
import request from 'supertest';
import { ok, fail } from '@mms/shared';
import { app } from '../src/index.js';

describe('Sales Audit', () => {
  it('ok() wraps data with success=true', () => {
    expect(ok({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
  });

  it('fail() wraps errors with success=false', () => {
    expect(fail('boom')).toEqual({ success: false, error: 'boom' });
  });

  it('GET /api/v1/register-closures returns a success envelope', async () => {
    const response = await request(app).get('/api/v1/register-closures');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});