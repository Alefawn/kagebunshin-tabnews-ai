import type { UsuarioSessao } from '@/lib/types';
import { usuarioAtual } from './sessao';
import { appUrl } from './appUrl';

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function erro(mensagem: string, status = 400): Response {
  return Response.json({ erro: mensagem }, { status });
}

export async function exigirUsuario(): Promise<UsuarioSessao | Response> {
  const usuario = await usuarioAtual();
  if (!usuario) return erro('Sessão expirada. Entre novamente.', 401);
  return usuario;
}

export function verificarOrigem(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const permitidos = [request.headers.get('x-forwarded-host'), request.headers.get('host')];
  try {
    permitidos.push(new URL(appUrl()).host);
  } catch {}
  return permitidos.some((esperado) => Boolean(esperado) && esperado === host);
}

export async function lerJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const dados = await request.json();
    if (dados && typeof dados === 'object' && !Array.isArray(dados)) return dados as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}
