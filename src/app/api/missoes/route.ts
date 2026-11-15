import { podeCriarItem } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import type { Prioridade } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRAZO = /^\d{4}-\d{2}-\d{2}$/;
const PRIORIDADES: Prioridade[] = ['baixa', 'media', 'alta', 'critica'];

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const corpo = await lerJson(request);
  const titulo = texto(corpo.titulo);
  if (!titulo) return erro('Informe o título da missão.', 400);

  const colunaId = texto(corpo.colunaId);
  if (!UUID.test(colunaId)) return erro('Coluna inválida.', 400);
  const colunas = await query('SELECT id FROM colunas WHERE id = $1', [colunaId]);
  if (!colunas.length) return erro('Coluna não encontrada.', 404);

  const secaoInformada = texto(corpo.secaoId);
  let divisaoId = '';
  let secaoId: string | null = null;

  if (secaoInformada) {
    if (!UUID.test(secaoInformada)) return erro('Seção inválida.', 400);
    const secoes = await query<{ id: string; divisao_id: string }>('SELECT id, divisao_id FROM secoes WHERE id = $1', [
      secaoInformada
    ]);
    if (!secoes.length) return erro('Seção não encontrada.', 404);
    divisaoId = secoes[0].divisao_id;
    secaoId = secoes[0].id;
  } else {
    divisaoId = texto(corpo.divisaoId);
    if (!UUID.test(divisaoId)) return erro('Informe a divisão ou a seção da missão.', 400);
    const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoId]);
    if (!divisoes.length) return erro('Divisão não encontrada.', 404);
  }

  if (!podeCriarItem(usuario, { divisaoId, secaoId: secaoId || '' })) {
    return erro('Sem permissão para criar missões nesta seção.', 403);
  }

  const prioridade = texto(corpo.prioridade) || 'media';
  if (!PRIORIDADES.includes(prioridade as Prioridade)) return erro('Prioridade inválida.', 400);

  const prazo = texto(corpo.prazo);
  if (prazo && !PRAZO.test(prazo)) return erro('Prazo inválido.', 400);

  const proxima = await query<{ ordem: number }>(
    'SELECT COALESCE(max(ordem), -1) + 1 AS ordem FROM missoes WHERE coluna_id = $1',
    [colunaId]
  );

  const criadas = await query<{ id: string }>(
    `INSERT INTO missoes (divisao_id, secao_id, coluna_id, titulo, descricao, prioridade, responsavel, prazo, ordem, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      divisaoId,
      secaoId,
      colunaId,
      titulo,
      texto(corpo.descricao),
      prioridade,
      texto(corpo.responsavel),
      prazo || null,
      proxima[0].ordem,
      usuario.id
    ]
  );

  return json({ id: criadas[0].id }, 201);
}
