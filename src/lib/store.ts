import type { DadosPainel, Missao, Papel, Prioridade, SecaoCounts } from './types';

export const PRIORIDADES: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica'
};

export const PRIORIDADE_VALORES: Prioridade[] = ['baixa', 'media', 'alta', 'critica'];

export const LINGUAGENS = ['Bash', 'PowerShell', 'Python', 'SQL', 'Batch', 'Outro'];

export const PAPEIS: Record<Papel, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  usuario: 'Usuário'
};

export function byOrdem(a: Missao, b: Missao): number {
  return (a.ordem || 0) - (b.ordem || 0);
}

export function lastColumnId(dados: Pick<DadosPainel, 'colunas'>): string {
  return dados.colunas.length ? dados.colunas[dados.colunas.length - 1].id : '';
}

export function secaoNome(dados: Pick<DadosPainel, 'secoes'>, id: string): string {
  const secao = dados.secoes.find((item) => item.id === id);
  return secao ? secao.nome : '';
}

export function countsSecao(
  dados: Pick<DadosPainel, 'missoes' | 'wiki' | 'scripts'>,
  id: string
): SecaoCounts {
  return {
    missoes: dados.missoes.filter((item) => item.secaoId === id).length,
    wiki: dados.wiki.filter((item) => item.secaoId === id).length,
    scripts: dados.scripts.filter((item) => item.secaoId === id).length
  };
}

export function reordenarMissao(dados: DadosPainel, id: string, colunaId: string, index: number): DadosPainel {
  const missao = dados.missoes.find((item) => item.id === id);
  if (!missao) return dados;
  const lista = dados.missoes.filter((item) => item.colunaId === colunaId && item.id !== id).sort(byOrdem);
  const posicao = Math.max(0, Math.min(index, lista.length));
  lista.splice(posicao, 0, { ...missao, colunaId });
  const ordens = new Map<string, number>();
  lista.forEach((item, pos) => ordens.set(item.id, pos));
  return {
    ...dados,
    missoes: dados.missoes.map((item) => {
      const ordem = ordens.get(item.id);
      if (ordem === undefined) return item;
      return { ...item, colunaId, ordem };
    })
  };
}
