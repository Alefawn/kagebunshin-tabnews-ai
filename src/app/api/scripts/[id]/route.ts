import { podeCriarItem, podeEditarItem, podeExcluirItem } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaScript {
  id: string;
  divisao_id: string;
  secao_id: string | null;
}

async function carregar(id: string): Promise<LinhaScript | null> {
  const linhas = await query<LinhaScript>('SELECT id, divisao_id, secao_id FROM scripts WHERE id = $1', [id]);
  return linhas[0] || null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Script inválido.', 400);

  const script = await carregar(id);
  if (!script) return erro('Script não encontrado.', 404);
  if (!podeEditarItem(usuario, { divisaoId: script.divisao_id, secaoId: script.secao_id || '' })) {
    return erro('Sem permissão para editar este script.', 403);
  }

  const corpo = await lerJson(request);

  let divisaoId = script.divisao_id;
  let secaoId = script.secao_id;

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
      const divisaoInformada = texto(corpo.divisaoId) || script.divisao_id;
      if (!UUID.test(divisaoInformada)) return erro('Divisão inválida.', 400);
      const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoInformada]);
      if (!divisoes.length) return erro('Divisão não encontrada.', 404);
      divisaoId = divisaoInformada;
      secaoId = null;
    }
  }

  if (!podeCriarItem(usuario, { divisaoId, secaoId: secaoId || '' })) {
    return erro('Sem permissão para mover o script para esta seção.', 403);
  }

  const nome = corpo.nome === undefined ? null : texto(corpo.nome);
  if (nome !== null && !nome) return erro('Informe o nome do script.', 400);

  const linguagem = corpo.linguagem === undefined ? null : texto(corpo.linguagem);
  if (linguagem !== null && !linguagem) return erro('Informe a linguagem do script.', 400);

  await query(
    `UPDATE scripts
        SET nome = COALESCE($2, nome),
            linguagem = COALESCE($3, linguagem),
            descricao = COALESCE($4, descricao),
            codigo = COALESCE($5, codigo),
            divisao_id = $6,
            secao_id = $7,
            atualizado_em = now()
      WHERE id = $1`,
    [
      id,
      nome,
      linguagem,
      corpo.descricao === undefined ? null : texto(corpo.descricao),
      typeof corpo.codigo === 'string' ? corpo.codigo : null,
      divisaoId,
      secaoId
    ]
  );

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Script inválido.', 400);

  const script = await carregar(id);
  if (!script) return erro('Script não encontrado.', 404);
  if (!podeExcluirItem(usuario, { divisaoId: script.divisao_id, secaoId: script.secao_id || '' })) {
    return erro('Sem permissão para excluir este script.', 403);
  }

  await query('DELETE FROM scripts WHERE id = $1', [id]);
  return json({ ok: true });
}
