import type { Metadata } from 'next';
import ConfiguracoesView from '@/components/views/ConfiguracoesView';

export const metadata: Metadata = {
  title: 'Configurações'
};

export default function ConfiguracoesPage() {
  return <ConfiguracoesView />;
}
