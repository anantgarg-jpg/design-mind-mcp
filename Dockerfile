FROM node:18-slim

WORKDIR /app

# python3 + PyYAML are required by knowledge.js for YAML parsing
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-yaml && rm -rf /var/lib/apt/lists/*

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

RUN chmod +x start.sh
CMD ["sh", "start.sh"]
