import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import {env} from '../config/env.js'

const connectionString = env.DATABASE_URL;
console.log(' DATABASE_URL =', connectionString);

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error(' Postgres pool error:', err);
});

export const db = drizzle(pool, { schema });