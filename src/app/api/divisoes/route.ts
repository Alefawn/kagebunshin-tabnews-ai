import { podeGerenciarDivisoes } from '@/lib/permissoes';
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
  if (!podeGerenciarDivisoes(usuario)) return erro('Sem permissão para gerenciar divisões.', 403);

  const corpo = await lerJson(request);
  const nome = texto(corpo.nome);
  if (!nome) return erro('Informe o nome da divisão.', 400);

  const criadas = await query<{ id: string }>(
    'INSERT INTO divisoes (nome, descricao, cor) VALUES ($1, $2, $3) RETURNING id',
    [nome, texto(corpo.descricao), safeColor(texto(corpo.cor))]
  );

  return json({ id: criadas[0].id }, 201);
}
