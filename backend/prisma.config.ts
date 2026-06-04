// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // Root solo para shadow DB en migraciones locales — el app user nunca usa root
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});