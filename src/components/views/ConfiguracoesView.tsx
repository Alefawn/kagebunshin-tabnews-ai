'use client';

import { useData } from '@/components/DataProvider';
import { useUI } from '@/components/UIProvider';
import { PAPEIS } from '@/lib/store';
import type { Tema } from '@/lib/types';

const VERSAO = '1.0.0';

const TEMAS: { valor: Tema; rotulo: string }[] = [
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
  { valor: 'system', rotulo: 'Sistema' }
];

export default function ConfiguracoesView() {
  const { dados, usuario, tema, setTema } = useData();
  const { toast } = useUI();

  const exportar = () => {
    const conteudo = JSON.stringify(dados, null, 2);
    try {
      const blob = new Blob([conteudo], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kagebunshin-dados.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Dados exportados.');
    } catch {
      toast('Não foi possível exportar os dados.', 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Configurações</h2>
          <p>Preferências de aparência e exportação dos dados visíveis.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="card settings-card">
          <h3>Aparência</h3>
          <p>Escolha o tema da interface. A preferência fica salva neste navegador.</p>
          <div className="segmented" id="tema-opcoes" role="group" aria-label="Tema da interface">
            {TEMAS.map((item) => (
              <button
                type="button"
                data-tema={item.valor}
                className={tema === item.valor ? 'active' : ''}
                key={item.valor}
                onClick={() => {
                  setTema(item.valor);
                  toast('Tema atualizado.');
                }}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
        </div>
        <div className="card settings-card">
          <h3>Dados</h3>
          <p>Baixe um JSON com as divisões, seções, missões, páginas e scripts que você enxerga.</p>
          <div className="settings-row">
            <button className="btn" type="button" onClick={exportar}>
              Exportar dados visíveis (JSON)
            </button>
          </div>
        </div>
        <div className="card settings-card">
          <h3>Sobre</h3>
          <div className="kv">
            <span>Versão</span>
            <strong>{VERSAO}</strong>
          </div>
          <div className="kv">
            <span>Seu papel</span>
            <strong>{PAPEIS[usuario.papel]}</strong>
          </div>
          {usuario.papel === 'admin' ? (
            <>
              <div className="kv">
                <span>Divisões</span>
                <strong>{dados.divisoes.length}</strong>
              </div>
              <div className="kv">
                <span>Seções</span>
                <strong>{dados.secoes.length}</strong>
              </div>
              <div className="kv">
                <span>Missões</span>
                <strong>{dados.missoes.length}</strong>
              </div>
              <div className="kv">
                <span>Páginas na wiki</span>
                <strong>{dados.wiki.length}</strong>
              </div>
              <div className="kv">
                <span>Scripts</span>
                <strong>{dados.scripts.length}</strong>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
