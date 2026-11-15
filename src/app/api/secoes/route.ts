import { podeGerenciarSecao } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { safeColor } from '@/lib/utils';

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
  const divisaoId = texto(corpo.divisaoId);
  const nome = texto(corpo.nome);
  if (!UUID.test(divisaoId)) return erro('Divisão inválida.', 400);
  if (!nome) return erro('Informe o nome da seção.', 400);
  if (!podeGerenciarSecao(usuario, divisaoId)) return erro('Sem permissão para gerenciar seções.', 403);

  const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoId]);
  if (!divisoes.length) return erro('Divisão não encontrada.', 404);

  const criadas = await query<{ id: string }>(
    'INSERT INTO secoes (divisao_id, nome, descricao, responsavel, cor) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [divisaoId, nome, texto(corpo.descricao), texto(corpo.responsavel), safeColor(texto(corpo.cor))]
  );

  return json({ id: criadas[0].id }, 201);
}
