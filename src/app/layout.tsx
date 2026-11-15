import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
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

const themeScript = `(function(){try{var pref=window.localStorage.getItem('kagebunshin:tema');if(pref!=='light'&&pref!=='dark')pref='system';var resolvido=pref;if(pref!=='light'&&pref!=='dark'){resolvido=(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',resolvido);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
