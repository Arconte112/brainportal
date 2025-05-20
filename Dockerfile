# Stage 1: Build the application
FROM oven/bun:1 as builder

# Set working directory
WORKDIR /app

# Install dependencies only when needed
COPY package.json bun.lock* tsconfig.json ./
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN bun run build

# Stage 2: Production image
FROM node:22-alpine as runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Set timezone as per next.config.mjs
ENV TZ=America/Santo_Domingo

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./

# Copy the public and static folders
# These are not included in the standalone output but are needed by Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Start the Next.js application
CMD ["node", "server.js"]
