FROM node:18-alpine

WORKDIR /app

# python3 + PyYAML are required by knowledge.js for YAML parsing
RUN apk add --no-cache python3 py3-yaml

# Install server dependencies first (better layer caching)
COPY server/package.json ./server/
RUN cd server && npm install --production

# Copy the full repo (genome, patterns, surfaces, ontology, safety, etc.)
COPY . .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENV TRANSPORT=sse
ENV PORT=8080

CMD ["node", "server/src/index.js"]
