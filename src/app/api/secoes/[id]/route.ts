import { podeGerenciarSecao } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { safeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaSecao {
  id: string;
  divisao_id: string;
  cor: string;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Seção inválida.', 400);

  const linhas = await query<LinhaSecao>('SELECT id, divisao_id, cor FROM secoes WHERE id = $1', [id]);
  const secao = linhas[0];
  if (!secao) return erro('Seção não encontrada.', 404);
  if (!podeGerenciarSecao(usuario, secao.divisao_id)) return erro('Sem permissão para gerenciar seções.', 403);

  const corpo = await lerJson(request);
  const nome = corpo.nome === undefined ? null : texto(corpo.nome);
  if (nome !== null && !nome) return erro('Informe o nome da seção.', 400);

  await query(
    `UPDATE secoes
        SET nome = COALESCE($2, nome),
            descricao = COALESCE($3, descricao),
            responsavel = COALESCE($4, responsavel),
            cor = $5
      WHERE id = $1`,
    [
      id,
      nome,
      corpo.descricao === undefined ? null : texto(corpo.descricao),
      corpo.responsavel === undefined ? null : texto(corpo.responsavel),
      corpo.cor === undefined ? secao.cor : safeColor(texto(corpo.cor), secao.cor)
    ]
  );

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Seção inválida.', 400);

  const linhas = await query<LinhaSecao>('SELECT id, divisao_id, cor FROM secoes WHERE id = $1', [id]);
  const secao = linhas[0];
  if (!secao) return erro('Seção não encontrada.', 404);
  if (!podeGerenciarSecao(usuario, secao.divisao_id)) return erro('Sem permissão para gerenciar seções.', 403);

  const contagens = await query<{ missoes: number; wiki: number; scripts: number }>(
    `SELECT (SELECT count(*)::int FROM missoes WHERE secao_id = $1) AS missoes,
            (SELECT count(*)::int FROM wiki WHERE secao_id = $1) AS wiki,
            (SELECT count(*)::int FROM scripts WHERE secao_id = $1) AS scripts`,
    [id]
  );

  await query('DELETE FROM secoes WHERE id = $1', [id]);

  return json({ ok: true, ...contagens[0] });
}
