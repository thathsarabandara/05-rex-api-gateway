import { vi, beforeEach } from 'vitest';
import nock from 'nock';

// Mock the Redis client connection and prevent connections to actual socket ports
vi.mock('ioredis', () => {
  return {
    default: class MockRedis {
      async ping() { return 'PONG'; }
      async quit() { return 'OK'; }
      on(event: string, cb: any) {
        if (event === 'connect') setTimeout(cb, 0);
      }
    },
    Redis: class MockRedis {
      async ping() { return 'PONG'; }
      async quit() { return 'OK'; }
      on(event: string, cb: any) {
        if (event === 'connect') setTimeout(cb, 0);
      }
    }
  };
});

// Configure default mock behavior for all rate limiters to pass requests
vi.mock('../src/services/rate-limit.service.js', () => {
  const createLimiter = (points: number) => ({
    consume: vi.fn().mockResolvedValue({
      remainingPoints: points - 1,
      msBeforeNext: 1000
    }),
    points
  });

  return {
    registerLimiter: createLimiter(5),
    loginLimiter: createLimiter(10),
    verifyOtpLimiter: createLimiter(10),
    resendOtpLimiter: createLimiter(3),
    forgotPasswordLimiter: createLimiter(5),
    refreshTokenLimiter: createLimiter(30),
    robotRegisterLimiter: createLimiter(5),
    robotClaimLimiter: createLimiter(10),
    credentialRotationLimiter: createLimiter(3),
    configUpdateLimiter: createLimiter(10),
    emergencyStopLimiter: createLimiter(5),
    wsConnectionLimiter: createLimiter(10),
    joystickLimiter: createLimiter(30),
    armControlLimiter: createLimiter(20)
  };
});

beforeEach(() => {
  // Ensure nock catches all external requests during tests but allows local test servers
  nock.cleanAll();
  nock.enableNetConnect(/(localhost|127\.0\.0\.1)/);
  vi.clearAllMocks();
});
