import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import Providers from '@/components/Providers';
import { usuarioAtual } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect('/login');

  return (
    <Providers usuarioInicial={usuario}>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
