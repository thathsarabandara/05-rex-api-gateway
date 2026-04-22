import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'express-http-proxy';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import identityRoutes from './routes/identity.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Security Middleware ====================
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ==================== Request Parsing ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== Logging ====================
app.use(morgan('combined'));
app.use(requestLogger);

// ==================== Rate Limiting ====================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ==================== Health Check ====================
app.use('/health', healthRoutes);

// ==================== API Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/identity', identityRoutes);

// ==================== Gateway Status ====================
app.get('/gateway/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVER_URL,
      identity: process.env.IDENTITY_SERVER_URL,
    }
  });
});

// ==================== 404 Handler ====================
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path
  });
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📡 Auth Server: ${process.env.AUTH_SERVER_URL}`);
  console.log(`🤖 Identity Server: ${process.env.IDENTITY_SERVER_URL}`);
  console.log(`🌐 Dashboard: ${process.env.WEB_DASHBOARD_URL}`);
});

export default app;
