import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();

// Normalize and strip accidental surrounding quotes in process.env
for (const key of Object.keys(process.env)) {
  const val = process.env[key];
  if (typeof val === 'string') {
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      process.env[key] = val.slice(1, -1);
    }
  }
}

// Ensure DATABASE_URL is valid PostgreSQL connection, otherwise clean it out so Prisma does not choke
const rawDbUrl = process.env.DATABASE_URL;
if (rawDbUrl && typeof rawDbUrl === 'string') {
  const trimmed = rawDbUrl.trim();
  if (trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://')) {
    process.env.DATABASE_URL = trimmed;
  } else {
    delete process.env.DATABASE_URL;
  }
}

// Ensure JWT_EXPIRES_IN is a valid timespan string (e.g., 7d, 24h, 3600)
const rawExpires = process.env.JWT_EXPIRES_IN;
if (rawExpires && typeof rawExpires === 'string') {
  const trimmed = rawExpires.trim().replace(/['"]/g, '');
  if (/^\d+[smhdwy]$/i.test(trimmed)) {
    // If set to 1s or 1m or 0, default to safe 7d
    if (trimmed === '1s' || trimmed === '1m' || trimmed === '0s') {
      process.env.JWT_EXPIRES_IN = '7d';
    } else {
      process.env.JWT_EXPIRES_IN = trimmed;
    }
  } else if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    // If raw integer is less than 3600 seconds, it is dangerously short (e.g. 1 second), default to 7d
    if (num < 3600) {
      process.env.JWT_EXPIRES_IN = '7d';
    } else {
      process.env.JWT_EXPIRES_IN = `${num}s`;
    }
  } else {
    process.env.JWT_EXPIRES_IN = '7d';
  }
} else {
  process.env.JWT_EXPIRES_IN = '7d';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleaned = val.replace(/['"]/g, '').trim().toLowerCase();
        if (['debug', 'info', 'warn', 'error'].includes(cleaned)) return cleaned;
      }
      return 'info';
    },
    z.enum(['debug', 'info', 'warn', 'error'])
  ).default('info'),
  JWT_SECRET: z.string().transform((val) => (val && val.length >= 16 ? val : 'default-dev-secret-change-in-production-min32')).default('default-dev-secret-change-in-production-min32'),
  JWT_EXPIRES_IN: z.string().transform((val) => {
    if (!val || val === '1' || val === '0') return '7d';
    if (/^\d+$/.test(val) && parseInt(val, 10) < 3600) return '7d';
    return val;
  }).default('7d'),
  APP_URL: z.string().optional().default('http://localhost:3000'),

  // Seed / Dev Account Configuration
  SEED_ADMIN_EMAIL: z.string().transform((val) => (val && val.includes('@') ? val : 'admin@smshub.local')).default('admin@smshub.local'),
  SEED_ADMIN_PASSWORD: z.string().transform((val) => (val && val.length > 5 ? val : 'Admin#Secure2026!')).default('Admin#Secure2026!'),
  SEED_MANAGER_EMAIL: z.string().transform((val) => (val && val.includes('@') ? val : 'manager@smshub.local')).default('manager@smshub.local'),
  SEED_MANAGER_PASSWORD: z.string().transform((val) => (val && val.length > 5 ? val : 'Manager#Secure2026!')).default('Manager#Secure2026!'),
  SEED_AGENT_EMAIL: z.string().transform((val) => (val && val.includes('@') ? val : 'agent@smshub.local')).default('agent@smshub.local'),
  SEED_AGENT_PASSWORD: z.string().transform((val) => (val && val.length > 5 ? val : 'Agent#Secure2026!')).default('Agent#Secure2026!'),
  SEED_CLIENT_EMAIL: z.string().transform((val) => (val && val.includes('@') ? val : 'client@smshub.local')).default('client@smshub.local'),
  SEED_CLIENT_PASSWORD: z.string().transform((val) => (val && val.length > 5 ? val : 'Client#Secure2026!')).default('Client#Secure2026!'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
