import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import identityRoutes from './routes/identity.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Security Middleware ====================
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ==================== API Routes (Proxies) ====================
// Note: Proxies must be mounted BEFORE body parsers to avoid hanging POST requests
app.use('/api/auth', authRoutes);
app.use('/api/identity', identityRoutes);

// ==================== Request Parsing ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// ==================== Logging ====================
if (process.env.ENV === 'dev' || process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
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
