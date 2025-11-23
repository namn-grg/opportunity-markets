# syntax=docker/dockerfile:1.7-labs

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_SAPPHIRE_RPC
ARG NEXT_PUBLIC_SAPPHIRE_MAINNET_RPC
ARG NEXT_PUBLIC_FACTORY_ADDRESS
ARG NEXT_PUBLIC_COLLATERAL_TOKEN
ARG NEXT_PUBLIC_DEMO_MODE=true
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ENV NEXT_PUBLIC_SAPPHIRE_RPC=${NEXT_PUBLIC_SAPPHIRE_RPC}
ENV NEXT_PUBLIC_SAPPHIRE_MAINNET_RPC=${NEXT_PUBLIC_SAPPHIRE_MAINNET_RPC}
ENV NEXT_PUBLIC_FACTORY_ADDRESS=${NEXT_PUBLIC_FACTORY_ADDRESS}
ENV NEXT_PUBLIC_COLLATERAL_TOKEN=${NEXT_PUBLIC_COLLATERAL_TOKEN}
ENV NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE}
ENV NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
RUN yarn install --frozen-lockfile --production=true --ignore-scripts
EXPOSE 3000
CMD ["yarn", "start"]
