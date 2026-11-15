import Link from 'next/link';
import type { Metadata } from 'next';
import { usuarioAtual } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kagebunshin · Gestão de TI'
};

const RECURSOS = [
  {
    titulo: 'Seções e divisões',
    texto: 'Organize a TI em divisões e seções com cor, responsável e contagem de itens vinculados.'
  },
  {
    titulo: 'Kanban de missões',
    texto: 'Acompanhe as missões em colunas configuráveis, com prioridade, prazo e arrastar e soltar.'
  },
  {
    titulo: 'Wiki técnica',
    texto: 'Registre procedimentos e runbooks com busca, filtro por seção e markdown simplificado.'
  },
  {
    titulo: 'Biblioteca de scripts',
    texto: 'Guarde automações por linguagem e seção, com cópia do código em um clique.'
  },
  {
    titulo: 'Perfis e permissões',
    texto: 'Admin, Gestor e Usuário: cada papel enxerga e altera apenas o que lhe cabe.'
  },
  {
    titulo: 'Tema claro e escuro',
    texto: 'Interface responsiva que respeita a preferência do sistema e a escolha de cada pessoa.'
  }
];

const PAPEIS = [
  {
    nome: 'Admin',
    texto: 'Cria divisões, colunas e usuários, e enxerga todas as divisões do painel.'
  },
  {
    nome: 'Gestor',
    texto: 'Cuida de uma divisão: seções, itens e usuários da própria equipe.'
  },
  {
    nome: 'Usuário',
    texto: 'Trabalha nas missões, páginas e scripts da sua seção.'
  }
];

export default async function HomePage() {
  const usuario = await usuarioAtual();

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="landing-brand">
          <span className="brand-mark" aria-hidden="true">
            影
          </span>
          <span className="brand-text">
            <strong>Kagebunshin</strong>
            <small>Gestão de TI</small>
          </span>
        </div>
        <nav className="landing-top-actions" aria-label="Acesso">
          {usuario ? (
            <Link className="btn btn-primary" href="/inicio">
              Ir para o painel
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost" href="/cadastro">
                Cadastrar-se
              </Link>
              <Link className="btn btn-primary" href="/login">
                Entrar
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-eyebrow">Painel de TI</p>
          <h1>Gestão de TI organizada por divisões e seções</h1>
          <p className="landing-subtitle">
            Missões, wiki, scripts e pessoas no mesmo lugar, com permissões por papel e cada equipe cuidando do seu
            próprio espaço.
          </p>
          <div className="landing-cta">
            {usuario ? (
              <Link className="btn btn-primary landing-btn-animado" href="/inicio">
                Ir para o painel
              </Link>
            ) : (
              <Link className="btn btn-primary landing-btn-animado" href="/login">
                Entrar
              </Link>
            )}
            {usuario ? null : (
              <Link className="btn btn-ghost" href="/cadastro">
                Cadastrar-se
              </Link>
            )}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="landing-recursos">
          <h2 id="landing-recursos">O que o painel entrega</h2>
          <div className="landing-grid">
            {RECURSOS.map((recurso) => (
              <article className="landing-card" key={recurso.titulo}>
                <h3>{recurso.titulo}</h3>
                <p>{recurso.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="landing-como-funciona">
          <h2 id="landing-como-funciona">Como funciona</h2>
          <div className="landing-papeis">
            {PAPEIS.map((papel) => (
              <article className="landing-papel" key={papel.nome}>
                <span className="landing-papel-nome">{papel.nome}</span>
                <p>{papel.texto}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-foot">
        <span>Kagebunshin · Gestão de TI</span>
        <span>Divisões, seções, missões, wiki e scripts.</span>
      </footer>
    </div>
  );
}
