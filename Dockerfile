# ==========================================
# Stage 1: Build & Compile TypeScript
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for compiling)
RUN npm ci

# Copy source code and test code
COPY src ./src

# Compile TypeScript to ES modules
RUN npm run build

# Prune devDependencies to keep final image clean
RUN npm prune --production

# ==========================================
# Stage 2: Production Runtime Environment
# ==========================================
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy production node_modules and compiled output
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Expose server listener port
EXPOSE 8000

# Set running user to standard non-root node user
USER node

# Health check using alpine's pre-installed wget pointing to live probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health/live || exit 1

# Start the application server
CMD ["node", "dist/server.js"]
