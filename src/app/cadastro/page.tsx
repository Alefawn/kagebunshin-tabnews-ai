import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CadastroForm from '@/components/CadastroForm';
import { usuarioAtual } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Criar conta'
};

const MENSAGENS: Record<string, string> = {
  google_indisponivel: 'Login com Google não configurado neste ambiente.',
  google_falhou: 'Não foi possível entrar com Google.'
};

export default async function CadastroPage({
  searchParams
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const usuario = await usuarioAtual();
  if (usuario) redirect('/inicio');

  const params = await searchParams;
  const codigo = typeof params.erro === 'string' ? params.erro : '';
  const erroInicial = codigo ? MENSAGENS[codigo] || '' : '';
  const googleDisponivel = Boolean((process.env.GOOGLE_CLIENT_ID || '').trim());

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            影
          </span>
          <span className="brand-text">
            <strong>Kagebunshin</strong>
            <small>Gestão de TI</small>
          </span>
        </Link>
        <h1>Criar conta</h1>
        <p className="auth-subtitle">Cadastre-se para aguardar a liberação de acesso.</p>
        <CadastroForm googleDisponivel={googleDisponivel} erroInicial={erroInicial} />
      </div>
    </div>
  );
}
