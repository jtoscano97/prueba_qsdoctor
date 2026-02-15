# RedactGuard Web
FROM node:20-alpine

# Install Rust for WASM build
RUN apk add --no-cache rust cargo

WORKDIR /app
COPY package.json package-lock.json ./
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY packages ./packages
COPY apps ./apps

RUN npm ci
RUN npm run build:wasm
RUN npm run build -w @redactguard/web

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@redactguard/web"]
