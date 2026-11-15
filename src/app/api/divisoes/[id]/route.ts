import { podeGerenciarDivisoes } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { safeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarDivisoes(usuario)) return erro('Sem permissão para gerenciar divisões.', 403);

  const { id } = await params;
  if (!UUID.test(id)) return erro('Divisão inválida.', 400);

  const existentes = await query<{ id: string; cor: string }>('SELECT id, cor FROM divisoes WHERE id = $1', [id]);
  if (!existentes.length) return erro('Divisão não encontrada.', 404);

  const corpo = await lerJson(request);
  const nome = corpo.nome === undefined ? null : texto(corpo.nome);
  if (nome !== null && !nome) return erro('Informe o nome da divisão.', 400);

  await query('UPDATE divisoes SET nome = COALESCE($2, nome), descricao = COALESCE($3, descricao), cor = $4 WHERE id = $1', [
    id,
    nome,
    corpo.descricao === undefined ? null : texto(corpo.descricao),
    corpo.cor === undefined ? existentes[0].cor : safeColor(texto(corpo.cor), existentes[0].cor)
  ]);

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarDivisoes(usuario)) return erro('Sem permissão para gerenciar divisões.', 403);

  const { id } = await params;
  if (!UUID.test(id)) return erro('Divisão inválida.', 400);

  const existentes = await query('SELECT id FROM divisoes WHERE id = $1', [id]);
  if (!existentes.length) return erro('Divisão não encontrada.', 404);

  const vinculos = await query<{ secoes: number; usuarios: number; itens: number }>(
    `SELECT (SELECT count(*)::int FROM secoes WHERE divisao_id = $1) AS secoes,
            (SELECT count(*)::int FROM usuarios WHERE divisao_id = $1) AS usuarios,
            (SELECT count(*)::int FROM missoes WHERE divisao_id = $1)
              + (SELECT count(*)::int FROM wiki WHERE divisao_id = $1)
              + (SELECT count(*)::int FROM scripts WHERE divisao_id = $1) AS itens`,
    [id]
  );
  const total = vinculos[0];
  if (total.secoes > 0 || total.usuarios > 0 || total.itens > 0) {
    return erro('A divisão ainda possui seções, usuários ou itens vinculados.', 409);
  }

  await query('DELETE FROM divisoes WHERE id = $1', [id]);
  return json({ ok: true });
}
