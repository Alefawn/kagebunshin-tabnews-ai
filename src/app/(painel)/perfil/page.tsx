import type { Metadata } from 'next';
import PerfilView from '@/components/views/PerfilView';

export const metadata: Metadata = {
  title: 'Perfil'
};

export default function PerfilPage() {
  return <PerfilView />;
}
