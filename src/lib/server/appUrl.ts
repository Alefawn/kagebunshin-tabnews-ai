export function appUrl(request?: Request): string {
  const configurada = (process.env.APP_URL || '').trim();
  if (configurada) return configurada.replace(/\/+$/, '');
  if (request) {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (host) return proto + '://' + host;
  }
  return 'http://localhost:3000';
}
