import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Papel, UsuarioSessao } from '@/lib/types';
import { query } from './db';

export const COOKIE_SESSAO = 'kb_sessao';

const DIAS_SESSAO = 30;
const SEGUNDOS_SESSAO = DIAS_SESSAO * 24 * 60 * 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function cookieSeguro(): boolean {
  return (process.env.APP_URL || '').trim().startsWith('https');
}

interface LinhaSessao {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  divisao_id: string | null;
  secao_id: string | null;
  cargo: string;
  telefone: string;
  bio: string;
  tem_senha: boolean;
  tem_google: boolean;
}

export async function criarSessao(usuarioId: string, resposta?: NextResponse): Promise<void> {
  await query('DELETE FROM sessoes WHERE expira_em <= now()');
  const token = randomBytes(32).toString('base64url');
  const expiraEm = new Date(Date.now() + SEGUNDOS_SESSAO * 1000);
  await query('INSERT INTO sessoes (id, usuario_id, expira_em) VALUES ($1, $2, $3)', [
    hashToken(token),
    usuarioId,
    expiraEm
  ]);
  const opcoes = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: cookieSeguro(),
    maxAge: SEGUNDOS_SESSAO
  };
  if (resposta) {
    resposta.cookies.set(COOKIE_SESSAO, token, opcoes);
    return;
  }
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, opcoes);
}

export async function usuarioAtual(): Promise<UsuarioSessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const linhas = await query<LinhaSessao>(
    `SELECT u.id, u.nome, u.email, u.papel, u.divisao_id, u.secao_id, u.cargo, u.telefone, u.bio,
            (u.senha_hash IS NOT NULL) AS tem_senha,
            (u.google_id IS NOT NULL) AS tem_google
       FROM sessoes s
       JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.id = $1 AND s.expira_em > now() AND u.ativo = true`,
    [hashToken(token)]
  );
  const linha = linhas[0];
  if (!linha) return null;
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    papel: linha.papel,
    divisaoId: linha.divisao_id,
    secaoId: linha.secao_id,
    cargo: linha.cargo,
    telefone: linha.telefone,
    bio: linha.bio,
    temSenha: linha.tem_senha,
    temGoogle: linha.tem_google
  };
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) await query('DELETE FROM sessoes WHERE id = $1', [hashToken(token)]);
  jar.delete(COOKIE_SESSAO);
}
