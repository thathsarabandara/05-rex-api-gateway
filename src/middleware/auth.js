import jwt from 'jsonwebtoken';

export const validateAuthToken = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token provided'
      });
    }

    // Verify token from auth server
    const decoded = jwt.verify(token, process.env.JWT_AUTH_SECRET, {
      algorithms: ['HS256']
    });

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token',
      error: error.message
    });
  }
};

export const validateIdentityToken = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No robot authentication token provided'
      });
    }

    // Verify token from identity server
    const decoded = jwt.verify(token, process.env.JWT_IDENTITY_SECRET, {
      algorithms: ['HS256']
    });

    req.robot = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired robot authentication token',
      error: error.message
    });
  }
};

export const validateOptionalToken = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    // Try to validate with auth server secret first
    try {
      const decoded = jwt.verify(token, process.env.JWT_AUTH_SECRET);
      req.user = decoded;
      req.tokenType = 'user';
      return next();
    } catch (e) {
      // Try identity server secret
      const decoded = jwt.verify(token, process.env.JWT_IDENTITY_SECRET);
      req.robot = decoded;
      req.tokenType = 'robot';
      return next();
    }
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token format',
      error: error.message
    });
  }
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check for token in cookies (for auth-server)
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  return null;
};
