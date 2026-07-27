FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache \
    imagemagick \
    file \
    curl

# ─── Dependencies ───
FROM base AS deps
COPY package*.json ./
RUN npm ci --frozen-lockfile

# ─── Development ───
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p uploads logs

EXPOSE 4000 9229
CMD ["npx", "nodemon", "--exec", "npx", "ts-node", "-r", "tsconfig-paths/register", "src/app.ts"]

# ─── Builder ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Production ───
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
RUN mkdir -p uploads logs

EXPOSE 4000
CMD ["node", "dist/app.js"]
