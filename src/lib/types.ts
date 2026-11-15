export type Tema = 'light' | 'dark' | 'system';

export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';

export type Papel = 'admin' | 'gestor' | 'usuario';

export interface Coluna {
  id: string;
  nome: string;
  cor: string;
}

export interface SecaoCounts {
  missoes: number;
  wiki: number;
  scripts: number;
}

export interface Divisao {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  criadoEm: string;
}

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  divisaoId: string | null;
  secaoId: string | null;
  cargo: string;
  telefone: string;
  bio: string;
  temSenha: boolean;
  temGoogle: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  divisaoId: string | null;
  secaoId: string | null;
  cargo: string;
  telefone: string;
  bio: string;
  ativo: boolean;
  criadoEm: string;
}

export interface Secao {
  id: string;
  divisaoId: string;
  nome: string;
  descricao: string;
  responsavel: string;
  cor: string;
  criadoEm: string;
}

export interface Missao {
  id: string;
  divisaoId: string;
  secaoId: string;
  colunaId: string;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  responsavel: string;
  prazo: string;
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface WikiPage {
  id: string;
  divisaoId: string;
  secaoId: string;
  titulo: string;
  conteudo: string;
  atualizadoEm: string;
}

export interface Script {
  id: string;
  divisaoId: string;
  secaoId: string;
  nome: string;
  linguagem: string;
  descricao: string;
  codigo: string;
  atualizadoEm: string;
}

export interface DadosPainel {
  usuario: UsuarioSessao;
  divisoes: Divisao[];
  secoes: Secao[];
  colunas: Coluna[];
  missoes: Missao[];
  wiki: WikiPage[];
  scripts: Script[];
}
