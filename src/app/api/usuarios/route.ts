import { papeisAtribuiveis, podeGerenciarUsuarios } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { hashSenha } from '@/lib/server/senha';
import type { Papel, Usuario } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaUsuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  divisao_id: string | null;
  secao_id: string | null;
  cargo: string;
  telefone: string;
  bio: string;
  ativo: boolean;
  criado_em: Date;
}

const CAMPOS = `id, nome, email, papel, divisao_id, secao_id, cargo, telefone, bio, ativo, criado_em`;

function mapear(linha: LinhaUsuario): Usuario {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    papel: linha.papel,
    divisaoId: linha.divisao_id,
    secaoId: linha.secao_id,
    cargo: linha.cargo,
    telefone: linha.telefone,
    bio: linha.bio,
    ativo: linha.ativo,
    criadoEm: linha.criado_em.toISOString()
  };
}

export async function GET() {
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarUsuarios(usuario)) return erro('Sem permissão para listar usuários.', 403);

  const linhas =
    usuario.papel === 'admin'
      ? await query<LinhaUsuario>('SELECT ' + CAMPOS + ' FROM usuarios ORDER BY nome')
      : await query<LinhaUsuario>('SELECT ' + CAMPOS + ' FROM usuarios WHERE divisao_id = $1 ORDER BY nome', [
          usuario.divisaoId
        ]);

  return json(linhas.map(mapear));
}

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;
  if (!podeGerenciarUsuarios(usuario)) return erro('Sem permissão para criar usuários.', 403);

  const corpo = await lerJson(request);
  const nome = texto(corpo.nome);
  const email = texto(corpo.email).toLowerCase();
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';

  if (!nome) return erro('Informe o nome.', 400);
  if (!EMAIL.test(email)) return erro('Informe um e-mail válido.', 400);
  if (senha.length < 8) return erro('A senha precisa ter pelo menos 8 caracteres.', 400);

  const papel = (texto(corpo.papel) || 'usuario') as Papel;
  if (!papeisAtribuiveis(usuario).includes(papel)) return erro('Papel não permitido.', 403);

  let divisaoId: string | null = null;
  let secaoId: string | null = null;

  if (usuario.papel === 'gestor') {
    if (!usuario.divisaoId) return erro('Gestor sem divisão não pode criar usuários.', 403);
    divisaoId = usuario.divisaoId;
    const secaoInformada = texto(corpo.secaoId);
    if (!UUID.test(secaoInformada)) return erro('Informe a seção do usuário.', 400);
    const secoes = await query<{ id: string; divisao_id: string }>('SELECT id, divisao_id FROM secoes WHERE id = $1', [
      secaoInformada
    ]);
    if (!secoes.length) return erro('Seção não encontrada.', 404);
    if (secoes[0].divisao_id !== divisaoId) return erro('A seção não pertence à sua divisão.', 403);
    secaoId = secoes[0].id;
  } else if (papel === 'gestor') {
    const divisaoInformada = texto(corpo.divisaoId);
    if (!UUID.test(divisaoInformada)) return erro('Informe a divisão do gestor.', 400);
    const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoInformada]);
    if (!divisoes.length) return erro('Divisão não encontrada.', 404);
    divisaoId = divisaoInformada;
    secaoId = null;
  } else {
    const secaoInformada = texto(corpo.secaoId);
    if (!UUID.test(secaoInformada)) return erro('Informe a seção do usuário.', 400);
    const secoes = await query<{ id: string; divisao_id: string }>('SELECT id, divisao_id FROM secoes WHERE id = $1', [
      secaoInformada
    ]);
    if (!secoes.length) return erro('Seção não encontrada.', 404);
    divisaoId = secoes[0].divisao_id;
    secaoId = secoes[0].id;
  }

  const existente = await query('SELECT id FROM usuarios WHERE lower(email) = $1', [email]);
  if (existente.length) return erro('Já existe um usuário com este e-mail.', 409);

  const criados = await query<{ id: string }>(
    `INSERT INTO usuarios (nome, email, senha_hash, papel, divisao_id, secao_id, cargo, telefone, bio, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      nome,
      email,
      await hashSenha(senha),
      papel,
      divisaoId,
      secaoId,
      texto(corpo.cargo),
      texto(corpo.telefone),
      texto(corpo.bio),
      corpo.ativo === undefined ? true : Boolean(corpo.ativo)
    ]
  );

  return json({ id: criados[0].id }, 201);
}
