# ========================================
# STAGE 1: BUILDER (Dependency installation)
# ========================================
# Môi trường build để cài đặt dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Layer 1: Copy package config files
COPY package*.json ./

# Layer 2: Install dependencies (gồm dev dependencies)
RUN npm install --legacy-peer-deps

# ========================================
# STAGE 2: RUNTIME (Production runtime)
# ========================================
# Môi trường runtime với dev server, chỉ copy file cần thiết
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy node_modules từ builder
# Điều này chứa tất cả npm packages đã cài từ stage 1
COPY --from=builder /app/node_modules ./node_modules

# Copy package files (tùy chọn, cho reference)
COPY package*.json ./

# Copy environment config
COPY .env.docker .env

# Copy source code ứng dụng
COPY . .

# ========================================
# RUNTIME CONFIGURATION
# ========================================
EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
