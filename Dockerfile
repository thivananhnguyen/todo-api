FROM node:22.16.0-alpine3.20 AS deps

WORKDIR /app

# Refresh base OS packages in build stage.
RUN apk upgrade --no-cache

# Install only production dependencies to keep runtime image small.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22.16.0-alpine3.20 AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Pull latest security patches available for this Alpine release.
RUN apk upgrade --no-cache

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Run as non-root for better container isolation.
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
