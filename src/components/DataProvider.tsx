'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { reordenarMissao } from '@/lib/store';
import type {
  DadosPainel,
  Papel,
  Prioridade,
  SecaoCounts,
  Tema,
  Usuario,
  UsuarioSessao
} from '@/lib/types';

export const CHAVE_TEMA = 'kagebunshin:tema';

export interface DivisaoInput {
  nome: string;
  descricao?: string;
  cor?: string;
}

export interface SecaoInput {
  divisaoId: string;
  nome: string;
  descricao?: string;
  responsavel?: string;
  cor?: string;
}

export interface MissaoInput {
  titulo: string;
  descricao?: string;
  secaoId?: string;
  divisaoId?: string;
  colunaId: string;
  prioridade?: Prioridade;
  responsavel?: string;
  prazo?: string;
}

export interface WikiInput {
  titulo: string;
  conteudo?: string;
  secaoId?: string;
  divisaoId?: string;
}

export interface ScriptInput {
  nome: string;
  linguagem?: string;
  descricao?: string;
  codigo?: string;
  secaoId?: string;
  divisaoId?: string;
}

export interface PerfilInput {
  nome: string;
  cargo?: string;
  telefone?: string;
  bio?: string;
}

export interface UsuarioInput {
  nome: string;
  email: string;
  senha?: string;
  papel: Papel;
  divisaoId?: string;
  secaoId?: string;
  cargo?: string;
  ativo?: boolean;
}

interface DataContextValue {
  dados: DadosPainel;
  usuario: UsuarioSessao;
  tema: Tema;
  setTema: (tema: Tema) => void;
  recarregar: () => Promise<void>;
  addDivisao: (input: DivisaoInput) => Promise<string>;
  updateDivisao: (id: string, patch: Partial<DivisaoInput>) => Promise<void>;
  removeDivisao: (id: string) => Promise<void>;
  addSecao: (input: SecaoInput) => Promise<string>;
  updateSecao: (id: string, patch: Partial<Omit<SecaoInput, 'divisaoId'>>) => Promise<void>;
  removeSecao: (id: string) => Promise<SecaoCounts>;
  addColuna: (nome: string, cor: string) => Promise<string>;
  updateColuna: (id: string, patch: { nome?: string; cor?: string }) => Promise<void>;
  moveColuna: (id: string, direcao: number) => Promise<void>;
  removeColuna: (id: string) => Promise<void>;
  addMissao: (input: MissaoInput) => Promise<string>;
  updateMissao: (id: string, patch: Partial<MissaoInput>) => Promise<void>;
  removeMissao: (id: string) => Promise<void>;
  moveMissao: (id: string, colunaId: string, index: number) => Promise<void>;
  addWiki: (input: WikiInput) => Promise<string>;
  updateWiki: (id: string, patch: Partial<WikiInput>) => Promise<void>;
  removeWiki: (id: string) => Promise<void>;
  addScript: (input: ScriptInput) => Promise<string>;
  updateScript: (id: string, patch: Partial<ScriptInput>) => Promise<void>;
  removeScript: (id: string) => Promise<void>;
  updatePerfil: (patch: PerfilInput) => Promise<void>;
  alterarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>;
  listarUsuarios: () => Promise<Usuario[]>;
  criarUsuario: (input: UsuarioInput) => Promise<string>;
  atualizarUsuario: (id: string, patch: Partial<UsuarioInput>) => Promise<void>;
  removerUsuario: (id: string) => Promise<void>;
  sair: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

async function api<T>(metodo: string, url: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(url, {
    method: metodo,
    headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: 'no-store'
  });
  const dados = (await resposta.json().catch(() => null)) as { erro?: string } | null;
  if (!resposta.ok) throw new Error((dados && dados.erro) || 'Não foi possível concluir a operação.');
  return dados as T;
}

function resolverTema(preferencia: Tema): 'light' | 'dark' {
  if (preferencia === 'light' || preferencia === 'dark') return preferencia;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function DataProvider({ usuarioInicial, children }: { usuarioInicial: UsuarioSessao; children: ReactNode }) {
  const router = useRouter();
  const [dados, setDados] = useState<DadosPainel | null>(null);
  const [usuario, setUsuario] = useState<UsuarioSessao>(usuarioInicial);
  const [tema, setTemaState] = useState<Tema>('system');
  const [falha, setFalha] = useState('');

  const recarregar = useCallback(async () => {
    const resposta = await fetch('/api/dados', { cache: 'no-store' });
    if (resposta.status === 401) {
      router.replace('/login');
      return;
    }
    const corpo = (await resposta.json().catch(() => null)) as DadosPainel | null;
    if (!resposta.ok || !corpo) throw new Error('Não foi possível carregar os dados do painel.');
    setDados(corpo);
    setUsuario(corpo.usuario);
    setFalha('');
  }, [router]);

  useEffect(() => {
    recarregar().catch(() => setFalha('Não foi possível carregar os dados do painel.'));
  }, [recarregar]);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_TEMA);
      if (salvo === 'light' || salvo === 'dark' || salvo === 'system') setTemaState(salvo);
    } catch {}
  }, []);

  useEffect(() => {
    const aplicar = () => {
      document.documentElement.setAttribute('data-theme', resolverTema(tema));
    };
    aplicar();
    if (tema !== 'system') return;
    if (typeof window.matchMedia !== 'function') return;
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    const aoMudar = () => aplicar();
    if (typeof consulta.addEventListener === 'function') consulta.addEventListener('change', aoMudar);
    else if (typeof consulta.addListener === 'function') consulta.addListener(aoMudar);
    return () => {
      if (typeof consulta.removeEventListener === 'function') consulta.removeEventListener('change', aoMudar);
      else if (typeof consulta.removeListener === 'function') consulta.removeListener(aoMudar);
    };
  }, [tema]);

  const setTema = useCallback((valor: Tema) => {
    setTemaState(valor);
    try {
      window.localStorage.setItem(CHAVE_TEMA, valor);
    } catch {}
  }, []);

  const addDivisao = useCallback(
    async (input: DivisaoInput) => {
      const criada = await api<{ id: string }>('POST', '/api/divisoes', input);
      await recarregar();
      return criada.id;
    },
    [recarregar]
  );

  const updateDivisao = useCallback(
    async (id: string, patch: Partial<DivisaoInput>) => {
      await api('PATCH', '/api/divisoes/' + id, patch);
      await recarregar();
    },
    [recarregar]
  );

  const removeDivisao = useCallback(
    async (id: string) => {
      await api('DELETE', '/api/divisoes/' + id);
      await recarregar();
    },
    [recarregar]
  );

  const addSecao = useCallback(
    async (input: SecaoInput) => {
      const criada = await api<{ id: string }>('POST', '/api/secoes', input);
      await recarregar();
      return criada.id;
    },
    [recarregar]
  );

  const updateSecao = useCallback(
    async (id: string, patch: Partial<Omit<SecaoInput, 'divisaoId'>>) => {
      await api('PATCH', '/api/secoes/' + id, patch);
      await recarregar();
    },
    [recarregar]
  );

  const removeSecao = useCallback(
    async (id: string) => {
      const resultado = await api<{ missoes: number; wiki: number; scripts: number }>(
        'DELETE',
        '/api/secoes/' + id
      );
      await recarregar();
      return { missoes: resultado.missoes, wiki: resultado.wiki, scripts: resultado.scripts };
    },
    [recarregar]
  );

  const addColuna = useCallback(
    async (nome: string, cor: string) => {
      const criada = await api<{ id: string }>('POST', '/api/colunas', { nome, cor });
      await recarregar();
      return criada.id;
    },
    [recarregar]
  );

  const updateColuna = useCallback(
    async (id: string, patch: { nome?: string; cor?: string }) => {
      await api('PATCH', '/api/colunas/' + id, patch);
      await recarregar();
    },
    [recarregar]
  );

  const moveColuna = useCallback(
    async (id: string, direcao: number) => {
      await api('PATCH', '/api/colunas/' + id, { direcao });
      await recarregar();
    },
    [recarregar]
  );

  const removeColuna = useCallback(
    async (id: string) => {
      await api('DELETE', '/api/colunas/' + id);
      await recarregar();
    },
    [recarregar]
  );

  const addMissao = useCallback(
    async (input: MissaoInput) => {
      const criada = await api<{ id: string }>('POST', '/api/missoes', input);
      await recarregar();
      return criada.id;
    },
    [recarregar]
  );

  const updateMissao = useCallback(
    async (id: string, patch: Partial<MissaoInput>) => {
      await api('PATCH', '/api/missoes/' + id, patch);
      await recarregar();
    },
    [recarregar]
  );

  const removeMissao = useCallback(
    async (id: string) => {
      await api('DELETE', '/api/missoes/' + id);
      await recarregar();
    },
    [recarregar]
  );

  const moveMissao = useCallback(
    async (id: string, colunaId: string, index: number) => {
      setDados((atual) => (atual ? reordenarMissao(atual, id, colunaId, index) : atual));
      try {
        await api('PATCH', '/api/missoes/' + id, { colunaId, index });
      } catch (erro) {
        await recarregar().catch(() => undefined);
        throw erro;
      }
    },
    [recarregar]
  );

  const addWiki = useCallback(
    async (input: WikiInput) => {
      const criada = await api<{ id: string }>('POST', '/api/wiki', input);
      await recarregar();
      return criada.id;
    },
    [recarregar]
  );

  const updateWiki = useCallback(
    async (id: string, patch: Partial<WikiInput>) => {
      await api('PATCH', '/api/wiki/' + id, patch);
      await recarregar();
    },
    [recarregar]
  );

  const removeWiki = useCallback(
    async (id: string) => {
      await api('DELETE', '/api/wiki/' + id);
      await recarregar();
    },
    [recarregar]
  );

  const addScript = useCallback(
    async (input: ScriptInput) => {
      const criado = await api<{ id: string }>('POST', '/api/scripts', input);
      await recarregar();
      return criado.id;
    },
    [recarregar]
  );

  const updateScript = useCallback(
    async (id: string, patch: Partial<ScriptInput>) => {
      await api('PATCH', '/api/scripts/' + id, patch);
      await recarregar();
    },
    [recarregar]
  );

  const removeScript = useCallback(
    async (id: string) => {
      await api('DELETE', '/api/scripts/' + id);
      await recarregar();
    },
    [recarregar]
  );

  const updatePerfil = useCallback(
    async (patch: PerfilInput) => {
      await api('PATCH', '/api/perfil', patch);
      await recarregar();
    },
    [recarregar]
  );

  const alterarSenha = useCallback(
    async (senhaAtual: string, novaSenha: string) => {
      await api('POST', '/api/perfil/senha', { senhaAtual, novaSenha });
      await recarregar();
    },
    [recarregar]
  );

  const listarUsuarios = useCallback(async () => {
    return api<Usuario[]>('GET', '/api/usuarios');
  }, []);

  const criarUsuario = useCallback(async (input: UsuarioInput) => {
    const criado = await api<{ id: string }>('POST', '/api/usuarios', input);
    return criado.id;
  }, []);

  const atualizarUsuario = useCallback(async (id: string, patch: Partial<UsuarioInput>) => {
    await api('PATCH', '/api/usuarios/' + id, patch);
  }, []);

  const removerUsuario = useCallback(async (id: string) => {
    await api('DELETE', '/api/usuarios/' + id);
  }, []);

  const sair = useCallback(async () => {
    await api('POST', '/api/auth/logout');
  }, []);

  const valor = useMemo<DataContextValue | null>(() => {
    if (!dados) return null;
    return {
      dados,
      usuario,
      tema,
      setTema,
      recarregar,
      addDivisao,
      updateDivisao,
      removeDivisao,
      addSecao,
      updateSecao,
      removeSecao,
      addColuna,
      updateColuna,
      moveColuna,
      removeColuna,
      addMissao,
      updateMissao,
      removeMissao,
      moveMissao,
      addWiki,
      updateWiki,
      removeWiki,
      addScript,
      updateScript,
      removeScript,
      updatePerfil,
      alterarSenha,
      listarUsuarios,
      criarUsuario,
      atualizarUsuario,
      removerUsuario,
      sair
    };
  }, [
    dados,
    usuario,
    tema,
    setTema,
    recarregar,
    addDivisao,
    updateDivisao,
    removeDivisao,
    addSecao,
    updateSecao,
    removeSecao,
    addColuna,
    updateColuna,
    moveColuna,
    removeColuna,
    addMissao,
    updateMissao,
    removeMissao,
    moveMissao,
    addWiki,
    updateWiki,
    removeWiki,
    addScript,
    updateScript,
    removeScript,
    updatePerfil,
    alterarSenha,
    listarUsuarios,
    criarUsuario,
    atualizarUsuario,
    removerUsuario,
    sair
  ]);

  if (!valor) {
    return <p className="empty">{falha || 'Carregando...'}</p>;
  }

  return <DataContext.Provider value={valor}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const contexto = useContext(DataContext);
  if (!contexto) throw new Error('useData precisa estar dentro de DataProvider');
  return contexto;
}
