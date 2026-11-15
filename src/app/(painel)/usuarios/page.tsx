import type { Metadata } from 'next';
import UsuariosView from '@/components/views/UsuariosView';

export const metadata: Metadata = {
  title: 'Usuários'
};

export default function UsuariosPage() {
  return <UsuariosView />;
}
