# Multi-stage build for Quill Your Dream

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install ALL dependencies
# (bundled server code still references vite/plugins)
COPY package*.json ./
RUN npm ci

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/attached_assets ./attached_assets
COPY --from=builder /app/scripts ./scripts

# Copy configuration and source files needed for DB migrations
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server

# Create directories for logs, temporary files, NeDB data, and sessions
RUN mkdir -p logs tmp data/nedb data/sessions

# Set environment to production
ENV NODE_ENV=production

# Expose port (default 3000, can be overridden)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with initialization
CMD ["sh", "scripts/docker-init.sh"]
