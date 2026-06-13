FROM node:22.12-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]
