import { podeGerenciarColunas } from '@/lib/permissoes';
import { query, transaction } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { safeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaColuna {
  id: string;
  nome: string;
  cor: string;
  posicao: number;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarColunas(usuario)) return erro('Sem permissão para gerenciar colunas.', 403);

  const { id } = await params;
  if (!UUID.test(id)) return erro('Coluna inválida.', 400);

  const linhas = await query<LinhaColuna>('SELECT id, nome, cor, posicao FROM colunas WHERE id = $1', [id]);
  const coluna = linhas[0];
  if (!coluna) return erro('Coluna não encontrada.', 404);

  const corpo = await lerJson(request);
  const nome = corpo.nome === undefined ? null : texto(corpo.nome);
  if (nome !== null && !nome) return erro('Informe o nome da coluna.', 400);

  const direcao = corpo.direcao === undefined ? 0 : Number(corpo.direcao);
  if (corpo.direcao !== undefined && direcao !== -1 && direcao !== 1) {
    return erro('Direção inválida.', 400);
  }

  await transaction(async (client) => {
    if (nome !== null || corpo.cor !== undefined) {
      await client.query('UPDATE colunas SET nome = COALESCE($2, nome), cor = $3 WHERE id = $1', [
        id,
        nome,
        corpo.cor === undefined ? coluna.cor : safeColor(texto(corpo.cor), coluna.cor)
      ]);
    }
    if (direcao !== 0) {
      const vizinha = await client.query<{ id: string; posicao: number }>(
        'SELECT id, posicao FROM colunas WHERE posicao = $1 ORDER BY id LIMIT 1',
        [coluna.posicao + direcao]
      );
      if (vizinha.rows[0]) {
        await client.query('UPDATE colunas SET posicao = $2 WHERE id = $1', [coluna.id, vizinha.rows[0].posicao]);
        await client.query('UPDATE colunas SET posicao = $2 WHERE id = $1', [vizinha.rows[0].id, coluna.posicao]);
      }
    }
  });

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarColunas(usuario)) return erro('Sem permissão para gerenciar colunas.', 403);

  const { id } = await params;
  if (!UUID.test(id)) return erro('Coluna inválida.', 400);

  const linhas = await query('SELECT id FROM colunas WHERE id = $1', [id]);
  if (!linhas.length) return erro('Coluna não encontrada.', 404);

  const total = await query<{ total: number }>('SELECT count(*)::int AS total FROM missoes WHERE coluna_id = $1', [id]);
  if (total[0].total > 0) return erro('A coluna ainda possui missões.', 409);

  await query('DELETE FROM colunas WHERE id = $1', [id]);
  return json({ ok: true });
}
