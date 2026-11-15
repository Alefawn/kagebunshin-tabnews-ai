'use client';

import type { ReactNode } from 'react';
import type { UsuarioSessao } from '@/lib/types';
import { DataProvider } from './DataProvider';
import { UIProvider } from './UIProvider';

export default function Providers({
  usuarioInicial,
  children
}: {
  usuarioInicial: UsuarioSessao;
  children: ReactNode;
}) {
  return (
    <UIProvider>
      <DataProvider usuarioInicial={usuarioInicial}>{children}</DataProvider>
    </UIProvider>
  );
}
