import { papeisAtribuiveis, podeEditarUsuario } from '@/lib/permissoes';
import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';
import { hashSenha } from '@/lib/server/senha';
import type { Papel } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

interface LinhaAlvo {
  id: string;
  papel: Papel;
  divisao_id: string | null;
  secao_id: string | null;
  ativo: boolean;
}

async function carregar(id: string): Promise<LinhaAlvo | null> {
  const linhas = await query<LinhaAlvo>('SELECT id, papel, divisao_id, secao_id, ativo FROM usuarios WHERE id = $1', [id]);
  return linhas[0] || null;
}

async function secaoDaDivisao(secaoId: string, divisaoId: string): Promise<boolean> {
  const secoes = await query<{ id: string; divisao_id: string }>('SELECT id, divisao_id FROM secoes WHERE id = $1', [
    secaoId
  ]);
  return Boolean(secoes[0]) && secoes[0].divisao_id === divisaoId;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Usuário inválido.', 400);

  const alvo = await carregar(id);
  if (!alvo) return erro('Usuário não encontrado.', 404);
  if (!podeEditarUsuario(usuario, { id: alvo.id, papel: alvo.papel, divisaoId: alvo.divisao_id })) {
    return erro('Sem permissão para editar este usuário.', 403);
  }

  const corpo = await lerJson(request);

  const papelFinal = (corpo.papel === undefined ? alvo.papel : texto(corpo.papel)) as Papel;
  if (alvo.papel === 'admin') {
    if (papelFinal !== 'admin') return erro('O administrador não pode ser rebaixado.', 403);
  } else if (!papeisAtribuiveis(usuario).includes(papelFinal)) {
    return erro('Papel não permitido.', 403);
  }

  let ativo = alvo.ativo;
  if (corpo.ativo !== undefined) {
    ativo = Boolean(corpo.ativo);
    if (alvo.papel === 'admin' && !ativo) return erro('O administrador não pode ser desativado.', 403);
  }

  let divisaoId = alvo.divisao_id;
  let secaoId = alvo.secao_id;

  if (papelFinal === 'admin') {
    divisaoId = null;
    secaoId = null;
  } else if (usuario.papel === 'gestor') {
    if (!usuario.divisaoId) return erro('Gestor sem divisão não pode editar usuários.', 403);
    divisaoId = usuario.divisaoId;
    const secaoInformada = corpo.secaoId === undefined ? alvo.secao_id || '' : texto(corpo.secaoId);
    if (!UUID.test(secaoInformada)) return erro('Informe a seção do usuário.', 400);
    if (!(await secaoDaDivisao(secaoInformada, divisaoId))) return erro('A seção não pertence à sua divisão.', 403);
    secaoId = secaoInformada;
  } else if (papelFinal === 'gestor') {
    const divisaoInformada = corpo.divisaoId === undefined ? alvo.divisao_id || '' : texto(corpo.divisaoId);
    if (!UUID.test(divisaoInformada)) return erro('Informe a divisão do gestor.', 400);
    const divisoes = await query('SELECT id FROM divisoes WHERE id = $1', [divisaoInformada]);
    if (!divisoes.length) return erro('Divisão não encontrada.', 404);
    divisaoId = divisaoInformada;
    secaoId = null;
  } else {
    const secaoInformada = corpo.secaoId === undefined ? alvo.secao_id || '' : texto(corpo.secaoId);
    if (!UUID.test(secaoInformada)) return erro('Informe a seção do usuário.', 400);
    const secoes = await query<{ id: string; divisao_id: string }>('SELECT id, divisao_id FROM secoes WHERE id = $1', [
      secaoInformada
    ]);
    if (!secoes.length) return erro('Seção não encontrada.', 404);
    divisaoId = secoes[0].divisao_id;
    secaoId = secoes[0].id;
  }

  const nome = corpo.nome === undefined ? null : texto(corpo.nome);
  if (nome !== null && !nome) return erro('Informe o nome.', 400);

  let email: string | null = null;
  if (corpo.email !== undefined) {
    email = texto(corpo.email).toLowerCase();
    if (!EMAIL.test(email)) return erro('Informe um e-mail válido.', 400);
    const existente = await query('SELECT id FROM usuarios WHERE lower(email) = $1 AND id <> $2', [email, id]);
    if (existente.length) return erro('Já existe um usuário com este e-mail.', 409);
  }

  let senhaHash: string | null = null;
  if (corpo.senha !== undefined && corpo.senha !== null && corpo.senha !== '') {
    const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
    if (senha.length < 8) return erro('A senha precisa ter pelo menos 8 caracteres.', 400);
    senhaHash = await hashSenha(senha);
  }

  await query(
    `UPDATE usuarios
        SET nome = COALESCE($2, nome),
            email = COALESCE($3, email),
            senha_hash = COALESCE($4, senha_hash),
            papel = $5,
            divisao_id = $6,
            secao_id = $7,
            cargo = COALESCE($8, cargo),
            telefone = COALESCE($9, telefone),
            bio = COALESCE($10, bio),
            ativo = $11
      WHERE id = $1`,
    [
      id,
      nome,
      email,
      senhaHash,
      papelFinal,
      divisaoId,
      secaoId,
      corpo.cargo === undefined ? null : texto(corpo.cargo),
      corpo.telefone === undefined ? null : texto(corpo.telefone),
      corpo.bio === undefined ? null : texto(corpo.bio),
      ativo
    ]
  );

  return json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const { id } = await params;
  if (!UUID.test(id)) return erro('Usuário inválido.', 400);

  const alvo = await carregar(id);
  if (!alvo) return erro('Usuário não encontrado.', 404);
  if (alvo.papel === 'admin') return erro('O administrador não pode ser excluído.', 403);
  if (alvo.id === usuario.id) return erro('Você não pode excluir a própria conta.', 403);
  if (!podeEditarUsuario(usuario, { id: alvo.id, papel: alvo.papel, divisaoId: alvo.divisao_id })) {
    return erro('Sem permissão para excluir este usuário.', 403);
  }

  await query('DELETE FROM usuarios WHERE id = $1', [id]);
  return json({ ok: true });
}
