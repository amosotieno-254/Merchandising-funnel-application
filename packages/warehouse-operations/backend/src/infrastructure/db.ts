import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import {env} from '../config/env.js'

const connectionPool = new Pool({
  connectionString:env.DATABASE_URL,
});

export const database = drizzle(connectionPool, { schema });
export { connectionPool };