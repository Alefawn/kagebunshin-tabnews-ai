import { podeGerenciarColunas } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { safeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarColunas(usuario)) return erro('Sem permissão para gerenciar colunas.', 403);

  const corpo = await lerJson(request);
  const nome = texto(corpo.nome);
  if (!nome) return erro('Informe o nome da coluna.', 400);

  const proxima = await query<{ posicao: number }>('SELECT COALESCE(max(posicao), -1) + 1 AS posicao FROM colunas');
  const criadas = await query<{ id: string }>(
    'INSERT INTO colunas (nome, cor, posicao) VALUES ($1, $2, $3) RETURNING id',
    [nome, safeColor(texto(corpo.cor), '#64748b'), proxima[0].posicao]
  );

  return json({ id: criadas[0].id }, 201);
}
