FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src ./src

# Expose port
EXPOSE 3001

# Start server
CMD ["bun", "run", "src/index.ts"]
