'use client';

import { useRef, useState } from 'react';
import { useData } from '@/components/DataProvider';
import { useUI } from '@/components/UIProvider';
import { STORAGE_KEY, validateImport } from '@/lib/store';
import type { Tema } from '@/lib/types';

const VERSAO = '1.0.0';

const TEMAS: { valor: Tema; rotulo: string }[] = [
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
  { valor: 'system', rotulo: 'Sistema' }
];

export default function ConfiguracoesView() {
  const { data, setTheme, resetSeed, clearAll, importData } = useData();
  const { toast, confirm } = useUI();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState('');

  const exportar = () => {
    const conteudo = JSON.stringify(data, null, 2);
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

  const importar = (file: File) => {
    const leitor = new FileReader();
    leitor.onload = async () => {
      let dados: unknown;
      try {
        dados = JSON.parse(String(leitor.result));
      } catch {
        toast('Arquivo JSON inválido.', 'error');
        return;
      }
      if (!validateImport(dados)) {
        toast('O arquivo não contém as listas esperadas.', 'error');
        return;
      }
      const ok = await confirm({
        title: 'Importar dados',
        message: 'Substituir os dados atuais pelos do arquivo? Esta ação não pode ser desfeita.',
        confirmLabel: 'Importar',
        danger: true
      });
      if (!ok) return;
      importData(dados);
      toast('Dados importados.');
    };
    leitor.onerror = () => {
      toast('Falha ao ler o arquivo.', 'error');
    };
    leitor.readAsText(file);
  };

  const restaurar = async () => {
    const ok = await confirm({
      title: 'Restaurar dados de exemplo',
      message: 'Substituir todos os dados atuais pelo conteúdo de exemplo?',
      confirmLabel: 'Restaurar',
      danger: true
    });
    if (!ok) return;
    resetSeed();
    toast('Dados de exemplo restaurados.');
  };

  const limpar = async () => {
    const ok = await confirm({
      title: 'Limpar tudo',
      message: 'Remover todas as seções, missões, páginas da wiki e scripts? O perfil e o tema são mantidos.',
      confirmLabel: 'Limpar',
      danger: true
    });
    if (!ok) return;
    clearAll();
    toast('Dados removidos.');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Configurações</h2>
          <p>Preferências de aparência e gestão dos dados locais.</p>
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
                className={data.theme === item.valor ? 'active' : ''}
                key={item.valor}
                onClick={() => {
                  setTheme(item.valor);
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
          <p>Exporte um backup em JSON, importe um arquivo existente ou recomece do zero.</p>
          <div className="settings-row">
            <button className="btn" type="button" onClick={exportar}>
              Exportar dados
            </button>
            <button className="btn" type="button" onClick={() => arquivoRef.current?.click()}>
              Importar dados
            </button>
            <input
              className="visually-hidden"
              id="import-file"
              type="file"
              accept="application/json,.json"
              ref={arquivoRef}
              value={arquivo}
              onChange={(event) => {
                const file = event.target.files && event.target.files[0];
                if (file) importar(file);
                setArquivo('');
              }}
            />
          </div>
          <div className="settings-row">
            <button className="btn" type="button" onClick={restaurar}>
              Restaurar dados de exemplo
            </button>
            <button className="btn btn-ghost btn-icon-danger" type="button" onClick={limpar}>
              Limpar tudo
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
            <span>Armazenamento</span>
            <strong>{STORAGE_KEY}</strong>
          </div>
          <div className="kv">
            <span>Seções</span>
            <strong>{data.secoes.length}</strong>
          </div>
          <div className="kv">
            <span>Missões</span>
            <strong>{data.missoes.length}</strong>
          </div>
          <div className="kv">
            <span>Páginas na wiki</span>
            <strong>{data.wiki.length}</strong>
          </div>
          <div className="kv">
            <span>Scripts</span>
            <strong>{data.scripts.length}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
