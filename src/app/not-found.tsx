import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-head">
      <div>
        <h2>Página não encontrada</h2>
        <p>O endereço acessado não existe no painel.</p>
      </div>
      <div className="page-actions">
        <Link className="btn btn-primary" href="/inicio">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
