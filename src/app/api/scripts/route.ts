import { podeCriarItem } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const corpo = await lerJson(request);
  const nome = texto(corpo.nome);
  if (!nome) return erro('Informe o nome do script.', 400);

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
    if (!UUID.test(divisaoId)) return erro('Informe a divisão ou a seção do script.', 400);
    const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoId]);
    if (!divisoes.length) return erro('Divisão não encontrada.', 404);
  }

  if (!podeCriarItem(usuario, { divisaoId, secaoId: secaoId || '' })) {
    return erro('Sem permissão para criar scripts nesta seção.', 403);
  }

  const criados = await query<{ id: string }>(
    `INSERT INTO scripts (divisao_id, secao_id, nome, linguagem, descricao, codigo, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      divisaoId,
      secaoId,
      nome,
      texto(corpo.linguagem) || 'Outro',
      texto(corpo.descricao),
      typeof corpo.codigo === 'string' ? corpo.codigo : '',
      usuario.id
    ]
  );

  return json({ id: criados[0].id }, 201);
}
