import type { Metadata } from 'next';
import SecoesView from '@/components/views/SecoesView';

export const metadata: Metadata = {
  title: 'Seções'
};

export default function SecoesPage() {
  return <SecoesView />;
}
