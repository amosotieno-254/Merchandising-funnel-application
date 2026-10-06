import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url({ message: 'DATABASE_URL must be a valid URL' })
    .refine(
      (value) =>
        value.startsWith('postgres://') || value.startsWith('postgresql://'),
      { message: 'DATABASE_URL must start with postgres:// or postgresql://' }
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;