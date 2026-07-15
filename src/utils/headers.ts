import { IncomingHttpHeaders } from 'http';

const SPOOFED_HEADERS = [
  'x-user-id',
  'x-session-id',
  'x-robot-id',
  'x-email-verified',
  'x-internal-service-token',
  'x-gateway-name',
  'x-request-id',
  'x-correlation-id',
];

/**
 * Mutates the headers object to delete client-supplied internal headers
 */
export function removeSpoofedHeaders(headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>): void {
  for (const header of SPOOFED_HEADERS) {
    delete headers[header];
    // Also delete any capitalized variants
    delete headers[header.toUpperCase()];
    // And standard title case versions
    const titleCase = header.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
    delete headers[titleCase];
  }
}
