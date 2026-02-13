FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies (bun.lock* matches bun.lock or bun.lockb)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production 2>/dev/null || bun install --production

# Copy source
COPY src ./src

# Expose port
EXPOSE 3001

# Start server
CMD ["bun", "run", "src/index.ts"]
