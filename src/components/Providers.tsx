'use client';

import type { ReactNode } from 'react';
import { DataProvider } from './DataProvider';
import { UIProvider } from './UIProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <DataProvider>{children}</DataProvider>
    </UIProvider>
  );
}
