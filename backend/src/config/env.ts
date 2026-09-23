import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from .env file
dotenv.config();

/**
 * Environment Variables Schema (Zod)
 * Validates all required configuration at startup so missing keys fail early and visibly.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Supabase & Postgres Database
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/pujacircle'),
  SUPABASE_URL: z.string().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // JWT & Sessions
  JWT_SECRET: z.string().default('default-super-secret-pujacircle-jwt-key'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('default-cookie-secret-key'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default('placeholder-cloudinary-cloud-name'),
  CLOUDINARY_API_KEY: z.string().default('placeholder-cloudinary-api-key'),
  CLOUDINARY_API_SECRET: z.string().default('placeholder-cloudinary-api-secret'),

  // Brevo (Sendinblue) Transactional REST API Email
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().default('noreply@pujacircle.com'),
  BREVO_SENDER_NAME: z.string().default('PujaCircle Sanctum'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
