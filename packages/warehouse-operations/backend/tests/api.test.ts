/// <reference types="jest" />
import request from 'supertest';
import { ok as successResponse, fail as errorResponse } from '@mms/shared';
import { app } from '../src/index.js';

describe('Warehouse Operations', () => {
  it('successResponse wraps data with success true', () => {
    expect(successResponse({ a: 1 })).toEqual({
      success: true,
      data: { a: 1 },
    });
  });

  it('errorResponse wraps errors with success false', () => {
    expect(errorResponse('boom')).toEqual({
      success: false,
      error: 'boom',
    });
  });

  it('GET /api/v1/storage-bins returns a success envelope', async () => {
    const response = await request(app).get('/api/v1/storage-bins');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});