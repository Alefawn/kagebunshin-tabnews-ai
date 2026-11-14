import type { Metadata } from 'next';
import WikiView from '@/components/views/WikiView';

export const metadata: Metadata = {
  title: 'Wiki'
};

export default function WikiPage() {
  return <WikiView />;
}
