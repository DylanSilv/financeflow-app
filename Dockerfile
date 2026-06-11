FROM node:22-alpine

WORKDIR /app/backend

# Instalar dependencias del backend
COPY backend/package*.json ./
RUN npm install

# Copiar prisma y generar client
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npx prisma generate

# Copiar source y compilar
COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npm run build

# Producción
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]
