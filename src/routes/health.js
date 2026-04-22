import express from 'express';
import axios from 'axios';

const router = express.Router();

const checkServiceHealth = async (url, name) => {
  try {
    const response = await axios.get(`${url}/health`, {
      timeout: 5000,
    });
    return {
      name,
      status: 'healthy',
      statusCode: response.status,
      responseTime: response.headers['x-response-time'] || 'N/A',
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      statusCode: error.response?.status || 'N/A',
      error: error.message,
    };
  }
};

// GET /health
// Get overall gateway health
router.get('/', async (req, res) => {
  const authHealth = await checkServiceHealth(
    process.env.AUTH_SERVER_URL,
    'Auth Server'
  );

  const identityHealth = await checkServiceHealth(
    process.env.IDENTITY_SERVER_URL,
    'Identity Server'
  );

  const overallStatus = authHealth.status === 'healthy' && identityHealth.status === 'healthy'
    ? 'healthy'
    : 'degraded';

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      authServer: authHealth,
      identityServer: identityHealth,
    },
  });
});

// GET /health/auth
// Check auth server health
router.get('/auth', async (req, res) => {
  const health = await checkServiceHealth(
    process.env.AUTH_SERVER_URL,
    'Auth Server'
  );

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// GET /health/identity
// Check identity server health
router.get('/identity', async (req, res) => {
  const health = await checkServiceHealth(
    process.env.IDENTITY_SERVER_URL,
    'Identity Server'
  );

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// GET /health/gateway
// Check gateway status
router.get('/gateway', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

export default router;
