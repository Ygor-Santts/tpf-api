// Behind Caddy the socket address is Caddy's. Caddy replaces any
// X-Forwarded-For a client sends, so its last entry is the real address.
export function clientIp(req: any): string {
  const forwarded = String(req.headers?.['x-forwarded-for'] ?? '');
  return forwarded.split(',').pop()?.trim() || req.ip || 'unknown';
}
