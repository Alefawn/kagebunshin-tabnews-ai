import type { Coluna, DadosPainel, Divisao, Missao, Prioridade, Script, Secao, WikiPage } from '@/lib/types';
import { query } from '@/lib/server/db';
import { exigirUsuario, json } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

interface LinhaDivisao {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  criado_em: Date;
}

interface LinhaSecao {
  id: string;
  divisao_id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  cor: string;
  criado_em: Date;
}

interface LinhaColuna {
  id: string;
  nome: string;
  cor: string;
}

interface LinhaMissao {
  id: string;
  divisao_id: string;
  secao_id: string | null;
  coluna_id: string;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  responsavel: string;
  prazo: string;
  ordem: number;
  criado_em: Date;
  atualizado_em: Date;
}

interface LinhaWiki {
  id: string;
  divisao_id: string;
  secao_id: string | null;
  titulo: string;
  conteudo: string;
  atualizado_em: Date;
}

interface LinhaScript {
  id: string;
  divisao_id: string;
  secao_id: string | null;
  nome: string;
  linguagem: string;
  descricao: string;
  codigo: string;
  atualizado_em: Date;
}

export async function GET() {
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const colunas = await query<LinhaColuna>('SELECT id, nome, cor FROM colunas ORDER BY posicao, nome');

  const dados: DadosPainel = {
    usuario,
    divisoes: [],
    secoes: [],
    colunas: colunas.map((linha): Coluna => ({ id: linha.id, nome: linha.nome, cor: linha.cor })),
    missoes: [],
    wiki: [],
    scripts: []
  };

  if (usuario.papel !== 'admin' && !usuario.divisaoId) return json(dados);

  const escopo = usuario.papel === 'admin' ? null : usuario.divisaoId;
  const filtro = escopo ? ' WHERE divisao_id = $1' : '';
  const params = escopo ? [escopo] : [];

  const divisoes = escopo
    ? await query<LinhaDivisao>('SELECT id, nome, descricao, cor, criado_em FROM divisoes WHERE id = $1', params)
    : await query<LinhaDivisao>('SELECT id, nome, descricao, cor, criado_em FROM divisoes ORDER BY nome');

  const secoes = await query<LinhaSecao>(
    'SELECT id, divisao_id, nome, descricao, responsavel, cor, criado_em FROM secoes' + filtro + ' ORDER BY nome',
    params
  );

  const missoes = await query<LinhaMissao>(
    `SELECT id, divisao_id, secao_id, coluna_id, titulo, descricao, prioridade, responsavel,
            COALESCE(to_char(prazo, 'YYYY-MM-DD'), '') AS prazo, ordem, criado_em, atualizado_em
       FROM missoes` + filtro + ' ORDER BY coluna_id, ordem, criado_em',
    params
  );

  const wiki = await query<LinhaWiki>(
    'SELECT id, divisao_id, secao_id, titulo, conteudo, atualizado_em FROM wiki' + filtro + ' ORDER BY atualizado_em DESC',
    params
  );

  const scripts = await query<LinhaScript>(
    `SELECT id, divisao_id, secao_id, nome, linguagem, descricao, codigo, atualizado_em
       FROM scripts` + filtro + ' ORDER BY nome',
    params
  );

  dados.divisoes = divisoes.map(
    (linha): Divisao => ({
      id: linha.id,
      nome: linha.nome,
      descricao: linha.descricao,
      cor: linha.cor,
      criadoEm: linha.criado_em.toISOString()
    })
  );

  dados.secoes = secoes.map(
    (linha): Secao => ({
      id: linha.id,
      divisaoId: linha.divisao_id,
      nome: linha.nome,
      descricao: linha.descricao,
      responsavel: linha.responsavel,
      cor: linha.cor,
      criadoEm: linha.criado_em.toISOString()
    })
  );

  dados.missoes = missoes.map(
    (linha): Missao => ({
      id: linha.id,
      divisaoId: linha.divisao_id,
      secaoId: linha.secao_id || '',
      colunaId: linha.coluna_id,
      titulo: linha.titulo,
      descricao: linha.descricao,
      prioridade: linha.prioridade,
      responsavel: linha.responsavel,
      prazo: linha.prazo,
      ordem: linha.ordem,
      criadoEm: linha.criado_em.toISOString(),
      atualizadoEm: linha.atualizado_em.toISOString()
    })
  );

  dados.wiki = wiki.map(
    (linha): WikiPage => ({
      id: linha.id,
      divisaoId: linha.divisao_id,
      secaoId: linha.secao_id || '',
      titulo: linha.titulo,
      conteudo: linha.conteudo,
      atualizadoEm: linha.atualizado_em.toISOString()
    })
  );

  dados.scripts = scripts.map(
    (linha): Script => ({
      id: linha.id,
      divisaoId: linha.divisao_id,
      secaoId: linha.secao_id || '',
      nome: linha.nome,
      linguagem: linha.linguagem,
      descricao: linha.descricao,
      codigo: linha.codigo,
      atualizadoEm: linha.atualizado_em.toISOString()
    })
  );

  return json(dados);
}
