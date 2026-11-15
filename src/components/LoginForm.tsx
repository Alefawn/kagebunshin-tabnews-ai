'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

interface Props {
  googleDisponivel: boolean;
  erroInicial: string;
}

export default function LoginForm({ googleDisponivel, erroInicial }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(erroInicial);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const dados = (await resposta.json().catch(() => ({}))) as { erro?: string };
      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível entrar.');
        return;
      }
      router.replace('/inicio');
      router.refresh();
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={enviar} noValidate>
      {erro ? (
        <p className="auth-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="login-email">E-mail</label>
        <input
          className="input"
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="login-senha">Senha</label>
        <input
          className="input"
          id="login-senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          required
        />
      </div>

      <button className="btn btn-primary landing-btn-animado btn-block" type="submit" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>

      {googleDisponivel ? (
        <a className="btn btn-ghost btn-block auth-google" href="/api/auth/google">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.23c1.89-1.74 2.97-4.3 2.97-7.36Z"
              fill="#4285f4"
              stroke="none"
            />
            <path
              d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
              fill="#34a853"
              stroke="none"
            />
            <path
              d="M6.41 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96l3.34-2.58Z"
              fill="#fbbc05"
              stroke="none"
            />
            <path
              d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2A10 10 0 0 0 3.07 7.52l3.34 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
              fill="#ea4335"
              stroke="none"
            />
          </svg>
          Entrar com Google
        </a>
      ) : (
        <button className="btn btn-ghost btn-block auth-google" type="button" disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.23c1.89-1.74 2.97-4.3 2.97-7.36Z"
              fill="#4285f4"
              stroke="none"
            />
            <path
              d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
              fill="#34a853"
              stroke="none"
            />
            <path
              d="M6.41 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96l3.34-2.58Z"
              fill="#fbbc05"
              stroke="none"
            />
            <path
              d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2A10 10 0 0 0 3.07 7.52l3.34 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
              fill="#ea4335"
              stroke="none"
            />
          </svg>
          Entrar com Google
        </button>
      )}

      {googleDisponivel ? null : (
        <p className="auth-hint">Login com Google não configurado neste ambiente.</p>
      )}

      <p className="auth-troca">
        Ainda não tem conta? <Link href="/cadastro">Cadastrar-se</Link>
      </p>
    </form>
  );
}
