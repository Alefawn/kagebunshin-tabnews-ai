import type { Metadata } from 'next';
import { Suspense } from 'react';
import MissoesView from '@/components/views/MissoesView';

export const metadata: Metadata = {
  title: 'Missões'
};

export default function MissoesPage() {
  return (
    <Suspense fallback={<p className="empty">Carregando…</p>}>
      <MissoesView />
    </Suspense>
  );
}
