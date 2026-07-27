# Stage 1: Base image
FROM node:22-alpine AS base

# Install pnpm globally (version 9 to match the lockfileVersion: '9.0')
RUN npm install -g pnpm@9

WORKDIR /app

# Stage 2: Install all dependencies (including devDependencies)
FROM base AS build-deps
COPY package.json pnpm-lock.yaml ./
# Install build essentials for native module compilation (e.g., bcrypt)
RUN apk add --no-cache python3 make g++ gcc
RUN pnpm install --frozen-lockfile

# Stage 3: Build the application
FROM build-deps AS builder
COPY . .
RUN pnpm run build

# Stage 4: Install only production dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN apk add --no-cache python3 make g++ gcc
RUN pnpm install --prod --frozen-lockfile

# Stage 5: Final runner image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from build stages
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose the application port
EXPOSE 3003

# Command to run the application in production
CMD ["node", "dist/main.js"]
