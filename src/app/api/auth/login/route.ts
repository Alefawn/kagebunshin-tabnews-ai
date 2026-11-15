import { query } from '@/lib/server/db';
import { erro, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { verificarSenha } from '@/lib/server/senha';
import { criarSessao } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

interface LinhaLogin {
  id: string;
  senha_hash: string | null;
  ativo: boolean;
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const corpo = await lerJson(request);
  const email = texto(corpo.email).toLowerCase();
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
  if (!email || !senha) return erro('Informe e-mail e senha.', 400);

  const linhas = await query<LinhaLogin>('SELECT id, senha_hash, ativo FROM usuarios WHERE lower(email) = $1', [
    email
  ]);
  const usuario = linhas[0];
  if (!usuario || !usuario.senha_hash) return erro('E-mail ou senha inválidos', 401);
  const confere = await verificarSenha(senha, usuario.senha_hash);
  if (!confere) return erro('E-mail ou senha inválidos', 401);
  if (!usuario.ativo) return erro('Usuário inativo. Procure um administrador.', 403);

  await criarSessao(usuario.id);
  return json({ ok: true });
}
