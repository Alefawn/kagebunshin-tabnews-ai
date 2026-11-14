import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s · Kagebunshin',
    default: 'Kagebunshin · Painel de TI'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark'
};

const themeScript = `(function(){try{var raw=window.localStorage.getItem('kagebunshin:data:v1');var pref='system';if(raw){var dados=JSON.parse(raw);if(dados&&(dados.theme==='light'||dados.theme==='dark'))pref=dados.theme;}var resolvido=pref;if(pref!=='light'&&pref!=='dark'){resolvido=(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',resolvido);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
