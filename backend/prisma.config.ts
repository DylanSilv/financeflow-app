// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

config();

export default defineConfig({
  datasource: {
    url:       process.env.DATABASE_URL,   // pooler URL (pgBouncer) — para la app
    directUrl: process.env.DIRECT_URL,    // direct URL — solo para migraciones
  },
});
