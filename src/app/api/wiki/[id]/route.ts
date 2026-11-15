import { podeCriarItem, podeEditarItem, podeExcluirItem } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaWiki {
  id: string;
  divisao_id: string;
  secao_id: string | null;
}

async function carregar(id: string): Promise<LinhaWiki | null> {
  const linhas = await query<LinhaWiki>('SELECT id, divisao_id, secao_id FROM wiki WHERE id = $1', [id]);
  return linhas[0] || null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Página inválida.', 400);

  const pagina = await carregar(id);
  if (!pagina) return erro('Página não encontrada.', 404);
  if (!podeEditarItem(usuario, { divisaoId: pagina.divisao_id, secaoId: pagina.secao_id || '' })) {
    return erro('Sem permissão para editar esta página.', 403);
  }

  const corpo = await lerJson(request);

  let divisaoId = pagina.divisao_id;
  let secaoId = pagina.secao_id;

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
      const divisaoInformada = texto(corpo.divisaoId) || pagina.divisao_id;
      if (!UUID.test(divisaoInformada)) return erro('Divisão inválida.', 400);
      const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoInformada]);
      if (!divisoes.length) return erro('Divisão não encontrada.', 404);
      divisaoId = divisaoInformada;
      secaoId = null;
    }
  }

  if (!podeCriarItem(usuario, { divisaoId, secaoId: secaoId || '' })) {
    return erro('Sem permissão para mover a página para esta seção.', 403);
  }

  const titulo = corpo.titulo === undefined ? null : texto(corpo.titulo);
  if (titulo !== null && !titulo) return erro('Informe o título da página.', 400);

  await query(
    `UPDATE wiki
        SET titulo = COALESCE($2, titulo),
            conteudo = COALESCE($3, conteudo),
            divisao_id = $4,
            secao_id = $5,
            atualizado_em = now()
      WHERE id = $1`,
    [id, titulo, typeof corpo.conteudo === 'string' ? corpo.conteudo : null, divisaoId, secaoId]
  );

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Página inválida.', 400);

  const pagina = await carregar(id);
  if (!pagina) return erro('Página não encontrada.', 404);
  if (!podeExcluirItem(usuario, { divisaoId: pagina.divisao_id, secaoId: pagina.secao_id || '' })) {
    return erro('Sem permissão para excluir esta página.', 403);
  }

  await query('DELETE FROM wiki WHERE id = $1', [id]);
  return json({ ok: true });
}
