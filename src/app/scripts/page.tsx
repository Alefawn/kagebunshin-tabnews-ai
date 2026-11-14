import type { Metadata } from 'next';
import ScriptsView from '@/components/views/ScriptsView';

export const metadata: Metadata = {
  title: 'Scripts'
};

export default function ScriptsPage() {
  return <ScriptsView />;
}
