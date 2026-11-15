import { podeCriarItem, podeEditarItem, podeExcluirItem } from '@/lib/permissoes';
import { query, transaction } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import type { Prioridade } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRAZO = /^\d{4}-\d{2}-\d{2}$/;
const PRIORIDADES: Prioridade[] = ['baixa', 'media', 'alta', 'critica'];

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaMissao {
  id: string;
  divisao_id: string;
  secao_id: string | null;
  coluna_id: string;
  ordem: number;
  prazo: string | null;
}

async function carregar(id: string): Promise<LinhaMissao | null> {
  const linhas = await query<LinhaMissao>(
    "SELECT id, divisao_id, secao_id, coluna_id, ordem, NULLIF(to_char(prazo, 'YYYY-MM-DD'), '') AS prazo FROM missoes WHERE id = $1",
    [id]
  );
  return linhas[0] || null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Missão inválida.', 400);

  const missao = await carregar(id);
  if (!missao) return erro('Missão não encontrada.', 404);
  if (!podeEditarItem(usuario, { divisaoId: missao.divisao_id, secaoId: missao.secao_id || '' })) {
    return erro('Sem permissão para editar esta missão.', 403);
  }

  const corpo = await lerJson(request);

  let divisaoId = missao.divisao_id;
  let secaoId = missao.secao_id;

  if (corpo.secaoId !== undefined) {
    const secaoInformada = texto(corpo.secaoId);
    if (secaoInformada) {
      if (!UUID.test(secaoInformada)) return erro('Seção inválida.', 400);
      const secoes = await query<{ id: string; divisao_id: string }>('SELECT id, divisao_id FROM secoes WHERE id = $1', [
        secaoInformada
      ]);
      if (!secoes.length) return erro('Seção não encontrada.', 404);
      divisaoId = secoes[0].divisao_id;
      secaoId = secoes[0].id;
    } else {
      const divisaoInformada = texto(corpo.divisaoId) || missao.divisao_id;
      if (!UUID.test(divisaoInformada)) return erro('Divisão inválida.', 400);
      const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoInformada]);
      if (!divisoes.length) return erro('Divisão não encontrada.', 404);
      divisaoId = divisaoInformada;
      secaoId = null;
    }
  } else if (corpo.divisaoId !== undefined && !missao.secao_id) {
    const divisaoInformada = texto(corpo.divisaoId);
    if (!UUID.test(divisaoInformada)) return erro('Divisão inválida.', 400);
    const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoInformada]);
    if (!divisoes.length) return erro('Divisão não encontrada.', 404);
    divisaoId = divisaoInformada;
  }

  if (!podeCriarItem(usuario, { divisaoId, secaoId: secaoId || '' })) {
    return erro('Sem permissão para mover a missão para esta seção.', 403);
  }

  const titulo = corpo.titulo === undefined ? null : texto(corpo.titulo);
  if (titulo !== null && !titulo) return erro('Informe o título da missão.', 400);

  let prioridade: string | null = null;
  if (corpo.prioridade !== undefined) {
    prioridade = texto(corpo.prioridade);
    if (!PRIORIDADES.includes(prioridade as Prioridade)) return erro('Prioridade inválida.', 400);
  }

  let prazo: string | null = null;
  if (corpo.prazo !== undefined) {
    prazo = texto(corpo.prazo);
    if (prazo && !PRAZO.test(prazo)) return erro('Prazo inválido.', 400);
  }

  let colunaId: string | null = null;
  if (corpo.colunaId !== undefined) {
    colunaId = texto(corpo.colunaId);
    if (!UUID.test(colunaId)) return erro('Coluna inválida.', 400);
    const colunas = await query('SELECT id FROM colunas WHERE id = $1', [colunaId]);
    if (!colunas.length) return erro('Coluna não encontrada.', 404);
  }

  let indice: number | null = null;
  if (corpo.index !== undefined) {
    indice = Number(corpo.index);
    if (!Number.isInteger(indice) || indice < 0) return erro('Posição inválida.', 400);
  }

  await transaction(async (client) => {
    await client.query(
      `UPDATE missoes
          SET titulo = COALESCE($2, titulo),
              descricao = COALESCE($3, descricao),
              prioridade = COALESCE($4, prioridade),
              responsavel = COALESCE($5, responsavel),
              prazo = $6,
              divisao_id = $7,
              secao_id = $8,
              atualizado_em = now()
        WHERE id = $1`,
      [
        id,
        titulo,
        corpo.descricao === undefined ? null : texto(corpo.descricao),
        prioridade,
        corpo.responsavel === undefined ? null : texto(corpo.responsavel),
        corpo.prazo === undefined ? missao.prazo : prazo || null,
        divisaoId,
        secaoId
      ]
    );

    if (colunaId) {
      if (colunaId !== missao.coluna_id) {
        const origem = await client.query<{ id: string }>(
          'SELECT id FROM missoes WHERE coluna_id = $1 AND id <> $2 ORDER BY ordem, criado_em',
          [missao.coluna_id, id]
        );
        for (let posicao = 0; posicao < origem.rows.length; posicao += 1) {
          await client.query('UPDATE missoes SET ordem = $2 WHERE id = $1', [origem.rows[posicao].id, posicao]);
        }
      }
      const destino = await client.query<{ id: string }>(
        'SELECT id FROM missoes WHERE coluna_id = $1 AND id <> $2 ORDER BY ordem, criado_em',
        [colunaId, id]
      );
      const ids = destino.rows.map((linha) => linha.id);
      const posicao = indice === null ? ids.length : Math.max(0, Math.min(indice, ids.length));
      ids.splice(posicao, 0, id);
      for (let ordem = 0; ordem < ids.length; ordem += 1) {
        await client.query('UPDATE missoes SET coluna_id = $2, ordem = $3 WHERE id = $1', [ids[ordem], colunaId, ordem]);
      }
    }
  });

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Missão inválida.', 400);

  const missao = await carregar(id);
  if (!missao) return erro('Missão não encontrada.', 404);
  if (!podeExcluirItem(usuario, { divisaoId: missao.divisao_id, secaoId: missao.secao_id || '' })) {
    return erro('Sem permissão para excluir esta missão.', 403);
  }

  await query('DELETE FROM missoes WHERE id = $1', [id]);
  return json({ ok: true });
}
