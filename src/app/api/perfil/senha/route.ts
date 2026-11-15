import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { hashSenha, verificarSenha } from '@/lib/server/senha';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const corpo = await lerJson(request);
  const novaSenha = typeof corpo.novaSenha === 'string' ? corpo.novaSenha : '';
  const senhaAtual = typeof corpo.senhaAtual === 'string' ? corpo.senhaAtual : '';

  if (novaSenha.length < 8) return erro('A nova senha precisa ter pelo menos 8 caracteres.', 400);

  const linhas = await query<{ senha_hash: string | null }>('SELECT senha_hash FROM usuarios WHERE id = $1', [
    usuario.id
  ]);
  const hashAtual = linhas[0]?.senha_hash || null;

  if (hashAtual) {
    if (!senhaAtual) return erro('Informe a senha atual.', 400);
    const confere = await verificarSenha(senhaAtual, hashAtual);
    if (!confere) return erro('Senha atual incorreta.', 403);
  }

  await query('UPDATE usuarios SET senha_hash = $2 WHERE id = $1', [usuario.id, await hashSenha(novaSenha)]);
  return json({ ok: true });
}
