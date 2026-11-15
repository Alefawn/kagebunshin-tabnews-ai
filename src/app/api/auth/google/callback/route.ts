import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { appUrl } from '@/lib/server/appUrl';
import { query } from '@/lib/server/db';
import { criarSessao } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

const COOKIE_ESTADO = 'kb_oauth_estado';

interface RespostaToken {
  access_token?: string;
}

interface RespostaUsuario {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

function falhou(base: string): NextResponse {
  const resposta = NextResponse.redirect(base + '/login?erro=google_falhou', 302);
  resposta.cookies.delete(COOKIE_ESTADO);
  return resposta;
}

export async function GET(request: Request) {
  const base = appUrl(request);
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) return falhou(base);

  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const estado = url.searchParams.get('state') || '';

  const jar = await cookies();
  const estadoCookie = jar.get(COOKIE_ESTADO)?.value || '';

  if (!code || !estado || !estadoCookie || estado !== estadoCookie) return falhou(base);

  const resposta = NextResponse.redirect(base + '/inicio', 302);
  resposta.cookies.delete(COOKIE_ESTADO);

  try {
    const respostaToken = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: base + '/api/auth/google/callback',
        grant_type: 'authorization_code'
      }),
      cache: 'no-store'
    });
    if (!respostaToken.ok) return falhou(base);
    const token = (await respostaToken.json()) as RespostaToken;
    if (!token.access_token) return falhou(base);

    const respostaUsuario = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: 'Bearer ' + token.access_token },
      cache: 'no-store'
    });
    if (!respostaUsuario.ok) return falhou(base);
    const perfil = (await respostaUsuario.json()) as RespostaUsuario;

    const email = (perfil.email || '').trim().toLowerCase();
    const googleId = (perfil.sub || '').trim();
    if (!email || !googleId || perfil.email_verified !== true) return falhou(base);

    const porGoogle = await query<{ id: string; ativo: boolean }>(
      'SELECT id, ativo FROM usuarios WHERE google_id = $1',
      [googleId]
    );
    let usuarioId = porGoogle[0]?.id || '';

    if (usuarioId) {
      if (!porGoogle[0].ativo) return falhou(base);
    } else {
      const porEmail = await query<{ id: string; ativo: boolean }>(
        'SELECT id, ativo FROM usuarios WHERE lower(email) = $1',
        [email]
      );
      if (porEmail[0]) {
        if (!porEmail[0].ativo) return falhou(base);
        await query('UPDATE usuarios SET google_id = $1 WHERE id = $2', [googleId, porEmail[0].id]);
        usuarioId = porEmail[0].id;
      } else {
        const criados = await query<{ id: string }>(
          "INSERT INTO usuarios (nome, email, google_id, papel, ativo) VALUES ($1, $2, $3, 'usuario', true) RETURNING id",
          [(perfil.name || '').trim() || email, email, googleId]
        );
        usuarioId = criados[0].id;
      }
    }

    await criarSessao(usuarioId, resposta);
    return resposta;
  } catch {
    return falhou(base);
  }
}
