// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrate: {
    url: process.env.DATABASE_URL,
  },
});