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
  const titulo = texto(corpo.titulo);
  if (!titulo) return erro('Informe o título da página.', 400);

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
    if (!UUID.test(divisaoId)) return erro('Informe a divisão ou a seção da página.', 400);
    const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoId]);
    if (!divisoes.length) return erro('Divisão não encontrada.', 404);
  }

  if (!podeCriarItem(usuario, { divisaoId, secaoId: secaoId || '' })) {
    return erro('Sem permissão para criar páginas nesta seção.', 403);
  }

  const criadas = await query<{ id: string }>(
    'INSERT INTO wiki (divisao_id, secao_id, titulo, conteudo, criado_por) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [divisaoId, secaoId, titulo, typeof corpo.conteudo === 'string' ? corpo.conteudo : '', usuario.id]
  );

  return json({ id: criadas[0].id }, 201);
}
