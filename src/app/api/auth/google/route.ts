import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { appUrl } from '@/lib/server/appUrl';

export const dynamic = 'force-dynamic';

const COOKIE_ESTADO = 'kb_oauth_estado';

export async function GET(request: Request) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const base = appUrl(request);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(base + '/login?erro=google_indisponivel', 302);
  }

  const estado = randomBytes(24).toString('base64url');

  const destino = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  destino.searchParams.set('client_id', clientId);
  destino.searchParams.set('redirect_uri', base + '/api/auth/google/callback');
  destino.searchParams.set('response_type', 'code');
  destino.searchParams.set('scope', 'openid email profile');
  destino.searchParams.set('state', estado);
  destino.searchParams.set('prompt', 'select_account');

  const resposta = NextResponse.redirect(destino.toString(), 302);
  resposta.cookies.set(COOKIE_ESTADO, estado, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: base.startsWith('https'),
    maxAge: 600
  });

  return resposta;
}
