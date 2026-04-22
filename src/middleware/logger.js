export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      console.error('[REQUEST]', JSON.stringify(log));
    } else {
      console.log('[REQUEST]', JSON.stringify(log));
    }
  });

  next();
};

export const contextLogger = (context) => {
  console.log(`[${new Date().toISOString()}] [${context}]`);
};
