'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useData } from './DataProvider';
import { useUI } from './UIProvider';
import { podeGerenciarUsuarios } from '@/lib/permissoes';
import { PAPEIS } from '@/lib/store';
import { initials } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  restrito?: boolean;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: '/inicio',
    label: 'Início',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    )
  },
  {
    href: '/secoes',
    label: 'Seções',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    )
  },
  {
    href: '/missoes',
    label: 'Missões',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="5" height="16" rx="1.5" />
        <rect x="9.5" y="4" width="5" height="10" rx="1.5" />
        <rect x="16" y="4" width="5" height="13" rx="1.5" />
      </svg>
    )
  },
  {
    href: '/wiki',
    label: 'Wiki',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
        <path d="M8 3v18" />
        <path d="M11.5 8h4" />
        <path d="M11.5 12h4" />
      </svg>
    )
  },
  {
    href: '/scripts',
    label: 'Scripts',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7.5 9.5 2.5 2.5-2.5 2.5" />
        <path d="M12.5 15h4" />
      </svg>
    )
  },
  {
    href: '/usuarios',
    label: 'Usuários',
    restrito: true,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
        <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.6" />
        <path d="M18 14.9c1.6.7 2.6 2.2 2.6 4.1" />
      </svg>
    )
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.1 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.3 9v.01a1.7 1.7 0 0 0 1.56 1.02H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    )
  }
];

const TITULOS: Record<string, string> = {
  '/inicio': 'Início',
  '/secoes': 'Seções',
  '/missoes': 'Missões',
  '/wiki': 'Wiki',
  '/scripts': 'Scripts',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
  '/perfil': 'Perfil'
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, tema, setTema, sair } = useData();
  const { toast } = useUI();
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [temaResolvido, setTemaResolvido] = useState<'light' | 'dark'>('light');
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    setDrawerAberto(false);
  }, [pathname]);

  useEffect(() => {
    const atualizar = () => {
      setTemaResolvido(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    };
    atualizar();
    const observador = new MutationObserver(atualizar);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const aoTeclar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, []);

  const titulo = TITULOS[pathname] || 'Início';
  const itens = NAV.filter((item) => !item.restrito || podeGerenciarUsuarios(usuario));

  const alternarTema = () => {
    setTema(temaResolvido === 'dark' ? 'light' : 'dark');
    toast('Tema atualizado.');
  };

  const sairDoPainel = async () => {
    setSaindo(true);
    try {
      await sair();
    } catch {
      setSaindo(false);
      return;
    }
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="app-shell">
      <aside
        className={'sidebar' + (drawerAberto ? ' open' : '')}
        id="sidebar"
        aria-label="Navegação principal"
      >
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            影
          </span>
          <span className="brand-text">
            <strong>Kagebunshin</strong>
            <small>Gestão de TI</small>
          </span>
        </div>

        <nav className="nav">
          {itens.map((item) => (
            <Link
              key={item.href}
              className={'nav-item' + (pathname === item.href ? ' active' : '')}
              href={item.href}
              onClick={() => setDrawerAberto(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Link
            className={'user-card' + (pathname === '/perfil' ? ' active' : '')}
            href="/perfil"
            onClick={() => setDrawerAberto(false)}
          >
            <span className="avatar" aria-hidden="true">
              {initials(usuario.nome)}
            </span>
            <span className="user-meta">
              <strong>{usuario.nome || 'Sem nome'}</strong>
              <small>{PAPEIS[usuario.papel]}</small>
            </span>
          </Link>
          <button
            className="icon-btn theme-toggle"
            type="button"
            onClick={alternarTema}
            aria-label={temaResolvido === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />
            </svg>
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={sairDoPainel}
            disabled={saindo}
            aria-label="Sair"
            title="Sair"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="m10 8-4 4 4 4" />
              <path d="M6 12h9" />
            </svg>
          </button>
        </div>
      </aside>

      {drawerAberto ? (
        <div className="sidebar-overlay" onClick={() => setDrawerAberto(false)} />
      ) : null}

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-toggle"
            type="button"
            onClick={() => setDrawerAberto((aberto) => !aberto)}
            aria-label="Abrir menu"
            aria-controls="sidebar"
            aria-expanded={drawerAberto}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1>{titulo}</h1>
        </header>
        <main className="view" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
