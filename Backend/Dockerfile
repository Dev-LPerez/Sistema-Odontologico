# Etapa 1: Base con Node y PNPM
FROM node:25-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
WORKDIR /app

# Etapa 2: Dependencias y construcción
FROM base AS builder
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml* ./
RUN printf "allowBuilds:\n  prisma: true\n  '@prisma/client': true\n  '@prisma/engines': true\n  '@nestjs/core': true\n  '@scarf/scarf': true\n" > pnpm-workspace.yaml
RUN pnpm install

COPY . .
RUN pnpm prisma:generate
RUN pnpm build
RUN pnpm prune --prod

# Etapa 3: Runner ligero de producción
FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Usuario sin privilegios por seguridad
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
