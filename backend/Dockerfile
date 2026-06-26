FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Questo step ricrea il client nella posizione standard (@prisma/client)
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/index.js"]