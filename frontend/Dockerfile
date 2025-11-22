# syntax=docker/dockerfile:1.7-labs

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN npm install

FROM base AS builder
ARG NEXT_PUBLIC_SAPPHIRE_RPC
ARG NEXT_PUBLIC_FACTORY_ADDRESS
ENV NEXT_PUBLIC_SAPPHIRE_RPC=${NEXT_PUBLIC_SAPPHIRE_RPC}
ENV NEXT_PUBLIC_FACTORY_ADDRESS=${NEXT_PUBLIC_FACTORY_ADDRESS}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]

