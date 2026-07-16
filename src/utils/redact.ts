const SENSITIVE_KEYS = [
  'password',
  'token',
  'refreshtoken',
  'otp',
  'secret',
  'authorization',
  'cookie',
  'credentials',
];

/**
 * Deeply redacts sensitive keys from an object or array to prevent leakages in logs.
 */
export function redactObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactObject(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
export default redactObject;
