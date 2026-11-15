import type { Metadata } from 'next';
import InicioView from '@/components/views/InicioView';

export const metadata: Metadata = {
  title: 'Início'
};

export default function InicioPage() {
  return <InicioView />;
}
