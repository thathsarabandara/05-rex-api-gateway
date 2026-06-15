# 🚪 REX-47 API Gateway

> **Repository `05`** · The central nervous system of the REX-47 backend. A Node.js/Express gateway that orchestrates routing, rate limiting, logging, and proxying requests to all internal microservices.

[![Platform](https://img.shields.io/badge/Platform-Backend-blue)]()
[![Language](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript)]()
[![Framework](https://img.shields.io/badge/Framework-Express-000000?logo=express)]()
[![Architecture](https://img.shields.io/badge/Architecture-Microservices-8A2BE2)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-green)]()

---

## 📋 Table of Contents

- [Overview](#-what-is-this-repository)
- [Architecture](#-architecture)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Routing Rules](#-routing-rules)
- [Security & Rate Limiting](#-security--rate-limiting)
- [Dependencies](#-dependencies)
- [Related Repositories](#-related-repositories)

---

## 🧭 What Is This Repository?

This is the **entry point for all external traffic** interacting with the REX-47 platform. Instead of exposing individual microservices (like Auth or Telemetry) directly to the Web and Mobile clients, all requests are funneled through this API Gateway.

**Key Highlights:**
- ✅ **Centralized Routing:** Reverse proxy setup directing `/api/v1/auth` to the Auth Service and `/api/v1/robot` to the Robot Service.
- ✅ **Security Shield:** Handles CORS, rate-limiting, and basic request sanitization before internal services are hit.
- ✅ **Centralized Logging:** Logs all incoming requests, response times, and failure rates to help debug system-wide issues.
- ✅ **Scalability:** Built on lightweight Express middleware, allowing horizontal scaling independent of the heavy computational services.

---

## 🏗️ Architecture

### Directory Structure

```
05-rex-api-gateway/
├── src/
│   ├── config/               ← Centralized environment variables
│   ├── middleware/           ← Rate limiters, CORS configuration, and loggers
│   ├── routes/               ← Proxy definitions and routing logic
│   ├── utils/                ← Helper functions and error formatting
│   └── server.js             ← Express app initialization and port binding
├── .env.example              ← Environment template file
├── docker-compose.yml        ← Infrastructure definition
├── Dockerfile                ← Container build instructions
├── package.json              ← Dependencies and scripts
└── README.md                 ← This documentation
```

---

## 🎨 Features

### 🌐 **Proxy & Routing**

| Feature | Description |
|---------|-------------|
| **Dynamic Proxying** | Utilizes `http-proxy-middleware` to forward HTTP requests securely. |
| **WebSocket Support** | Seamlessly proxies WS/WSS connections for real-time telemetry streaming. |
| **Path Rewriting** | Cleans up external URLs before hitting internal microservice boundaries. |

### 🛡️ **Security & Reliability**

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | Prevents DDoS and brute-force attacks via `express-rate-limit`. |
| **CORS Policy** | Strict cross-origin resource sharing rules, whitelist-based. |
| **Helmet Security** | Sets secure HTTP headers out of the box to prevent XSS and clickjacking. |
| **Health Checks** | Exposes `/health` to verify gateway and downstream service liveliness. |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Docker & Docker Compose** (highly recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/thathsarabandara/05-rex-api-gateway.git
cd 05-rex-api-gateway

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

### Environment Configuration

In your `.env` file, define the internal URIs of the downstream microservices:

```env
PORT=5000
NODE_ENV=development

# Downstream Services
AUTH_SERVICE_URL=http://auth-service:5001
ROBOT_SERVICE_URL=http://robot-service:5002
TELEMETRY_SERVICE_URL=http://telemetry-service:5003
```

### Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 🔀 Routing Rules

The Gateway translates external requests into internal traffic based on path prefixes:

- `GET /api/v1/auth/*` ➔ Proxied to **Auth Service** (Port 5001)
- `POST /api/v1/robot/*` ➔ Proxied to **Robot Service** (Port 5002)
- `WS /ws/telemetry` ➔ Upgraded and proxied to **Telemetry Service** (Port 5003)

---

## 📦 Dependencies

### Core
- `express` — Fast, unopinionated, minimalist web framework
- `http-proxy-middleware` — The core proxying engine

### Security & Utility
- `cors` — Cross-Origin Resource Sharing
- `helmet` — Secure HTTP headers
- `express-rate-limit` — Basic rate-limiting middleware
- `morgan` — HTTP request logger middleware

---

## 🔗 Related Repositories

- [06-rex-auth-service](../06-rex-auth-service) — Handles the proxied `/auth` traffic.
- [07-rex-robot-service](../07-rex-robot-service) — Handles the proxied `/robot` traffic.
- [08-rex-telemetry-service](../08-rex-telemetry-service) — Handles the proxied WebSocket traffic.
- [17-rex-devops-infras](../17-rex-devops-infras) — Master Docker Compose deploying this gateway.
