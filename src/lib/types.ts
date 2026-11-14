export type Tema = 'light' | 'dark' | 'system';

export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';

export interface Profile {
  nome: string;
  email: string;
  cargo: string;
  telefone: string;
  bio: string;
}

export interface Secao {
  id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  cor: string;
  criadoEm: string;
}

export interface Coluna {
  id: string;
  nome: string;
  cor: string;
}

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  secaoId: string;
  colunaId: string;
  prioridade: Prioridade;
  responsavel: string;
  prazo: string;
  ordem: number;
  criadoEm: string;
}

export interface WikiPage {
  id: string;
  titulo: string;
  conteudo: string;
  secaoId: string;
  atualizadoEm: string;
}

export interface Script {
  id: string;
  nome: string;
  linguagem: string;
  descricao: string;
  codigo: string;
  secaoId: string;
  atualizadoEm: string;
}

export interface AppData {
  profile: Profile;
  theme: Tema;
  secoes: Secao[];
  colunas: Coluna[];
  missoes: Missao[];
  wiki: WikiPage[];
  scripts: Script[];
}

export interface SecaoCounts {
  missoes: number;
  wiki: number;
  scripts: number;
}
