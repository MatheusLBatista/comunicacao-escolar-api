FROM node:22-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --no-fund --no-audit

FROM node:22-alpine
WORKDIR /usr/src/app

# Executa como usuario nao-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 3010

CMD ["node", "server.js"]
