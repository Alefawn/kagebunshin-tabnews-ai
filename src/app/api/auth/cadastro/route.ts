import { query } from '@/lib/server/db';
import { erro, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { hashSenha } from '@/lib/server/senha';
import { criarSessao } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const corpo = await lerJson(request);
  const nome = texto(corpo.nome);
  const email = texto(corpo.email).toLowerCase();
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';

  if (!nome) return erro('Informe o nome.', 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('Informe um e-mail válido.', 400);
  if (senha.length < 8) return erro('A senha precisa ter pelo menos 8 caracteres.', 400);

  const existente = await query('SELECT id FROM usuarios WHERE lower(email) = $1', [email]);
  if (existente.length) return erro('Já existe uma conta com este e-mail.', 409);

  const criados = await query<{ id: string }>(
    "INSERT INTO usuarios (nome, email, senha_hash, papel, ativo) VALUES ($1, $2, $3, 'usuario', true) RETURNING id",
    [nome, email, await hashSenha(senha)]
  );

  await criarSessao(criados[0].id);
  return json({ ok: true }, 201);
}
