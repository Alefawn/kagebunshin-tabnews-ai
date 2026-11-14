'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { AppData, Coluna, Missao, Profile, Script, Secao, SecaoCounts, Tema, WikiPage } from '@/lib/types';
import * as store from '@/lib/store';

interface DataContextValue {
  data: AppData;
  hydrated: boolean;
  addSecao: (input: store.SecaoInput) => Secao | null;
  updateSecao: (id: string, patch: Partial<store.SecaoInput>) => void;
  removeSecao: (id: string) => SecaoCounts;
  addColuna: (nome: string, cor: string) => Coluna | null;
  updateColuna: (id: string, patch: { nome?: string; cor?: string }) => void;
  moveColuna: (id: string, direction: number) => void;
  removeColuna: (id: string) => { ok: boolean; total: number };
  addMissao: (input: store.MissaoInput) => Missao | null;
  updateMissao: (id: string, patch: Partial<store.MissaoInput>) => void;
  removeMissao: (id: string) => void;
  moveMissao: (id: string, colunaId: string, index: number) => void;
  addWiki: (input: store.WikiInput) => WikiPage | null;
  updateWiki: (id: string, patch: Partial<store.WikiInput>) => void;
  removeWiki: (id: string) => void;
  addScript: (input: store.ScriptInput) => Script | null;
  updateScript: (id: string, patch: Partial<store.ScriptInput>) => void;
  removeScript: (id: string) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setTheme: (theme: Tema) => void;
  resetSeed: () => void;
  clearAll: () => void;
  importData: (raw: unknown) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function resolverTema(preferencia: Tema): 'light' | 'dark' {
  if (preferencia === 'light' || preferencia === 'dark') return preferencia;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    setData(store.load());
  }, []);

  useEffect(() => {
    if (!data) return;
    store.persist(data);
  }, [data]);

  const tema = data ? data.theme : null;

  useEffect(() => {
    if (!tema) return;
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

  const addSecao = useCallback(
    (input: store.SecaoInput) => {
      if (!data) return null;
      const resultado = store.addSecao(data, input);
      setData(resultado.data);
      return resultado.item;
    },
    [data]
  );

  const updateSecao = useCallback(
    (id: string, patch: Partial<store.SecaoInput>) => {
      if (!data) return;
      setData(store.updateSecao(data, id, patch));
    },
    [data]
  );

  const removeSecao = useCallback(
    (id: string) => {
      if (!data) return { missoes: 0, wiki: 0, scripts: 0 };
      const counts = store.countsSecao(data, id);
      setData(store.removeSecao(data, id));
      return counts;
    },
    [data]
  );

  const addColuna = useCallback(
    (nome: string, cor: string) => {
      if (!data) return null;
      const resultado = store.addColuna(data, nome, cor);
      setData(resultado.data);
      return resultado.item;
    },
    [data]
  );

  const updateColuna = useCallback(
    (id: string, patch: { nome?: string; cor?: string }) => {
      if (!data) return;
      setData(store.updateColuna(data, id, patch));
    },
    [data]
  );

  const moveColuna = useCallback(
    (id: string, direction: number) => {
      if (!data) return;
      setData(store.moveColuna(data, id, direction));
    },
    [data]
  );

  const removeColuna = useCallback(
    (id: string) => {
      if (!data) return { ok: false, total: 0 };
      const resultado = store.removeColuna(data, id);
      if (resultado.ok) setData(resultado.data);
      return { ok: resultado.ok, total: resultado.total };
    },
    [data]
  );

  const addMissao = useCallback(
    (input: store.MissaoInput) => {
      if (!data) return null;
      const resultado = store.addMissao(data, input);
      setData(resultado.data);
      return resultado.item;
    },
    [data]
  );

  const updateMissao = useCallback(
    (id: string, patch: Partial<store.MissaoInput>) => {
      if (!data) return;
      setData(store.updateMissao(data, id, patch));
    },
    [data]
  );

  const removeMissao = useCallback(
    (id: string) => {
      if (!data) return;
      setData(store.removeMissao(data, id));
    },
    [data]
  );

  const moveMissao = useCallback(
    (id: string, colunaId: string, index: number) => {
      if (!data) return;
      setData(store.moveMissao(data, id, colunaId, index));
    },
    [data]
  );

  const addWiki = useCallback(
    (input: store.WikiInput) => {
      if (!data) return null;
      const resultado = store.addWiki(data, input);
      setData(resultado.data);
      return resultado.item;
    },
    [data]
  );

  const updateWiki = useCallback(
    (id: string, patch: Partial<store.WikiInput>) => {
      if (!data) return;
      setData(store.updateWiki(data, id, patch));
    },
    [data]
  );

  const removeWiki = useCallback(
    (id: string) => {
      if (!data) return;
      setData(store.removeWiki(data, id));
    },
    [data]
  );

  const addScript = useCallback(
    (input: store.ScriptInput) => {
      if (!data) return null;
      const resultado = store.addScript(data, input);
      setData(resultado.data);
      return resultado.item;
    },
    [data]
  );

  const updateScript = useCallback(
    (id: string, patch: Partial<store.ScriptInput>) => {
      if (!data) return;
      setData(store.updateScript(data, id, patch));
    },
    [data]
  );

  const removeScript = useCallback(
    (id: string) => {
      if (!data) return;
      setData(store.removeScript(data, id));
    },
    [data]
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      if (!data) return;
      setData(store.updateProfile(data, patch));
    },
    [data]
  );

  const setTheme = useCallback(
    (theme: Tema) => {
      if (!data) return;
      setData(store.setTheme(data, theme));
    },
    [data]
  );

  const resetSeed = useCallback(() => {
    setData(store.seed());
  }, []);

  const clearAll = useCallback(() => {
    if (!data) return;
    setData(store.clearAll(data));
  }, [data]);

  const importData = useCallback((raw: unknown) => {
    setData(store.importData(raw));
  }, []);

  const valor = useMemo<DataContextValue | null>(() => {
    if (!data) return null;
    return {
      data,
      hydrated: true,
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
      updateProfile,
      setTheme,
      resetSeed,
      clearAll,
      importData
    };
  }, [
    data,
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
    updateProfile,
    setTheme,
    resetSeed,
    clearAll,
    importData
  ]);

  if (!valor) {
    return <p className="empty">Carregando…</p>;
  }

  return <DataContext.Provider value={valor}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const contexto = useContext(DataContext);
  if (!contexto) throw new Error('useData precisa estar dentro de DataProvider');
  return contexto;
}
