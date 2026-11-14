'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { LINGUAGENS } from '@/lib/store';
import type { Script } from '@/lib/types';
import { formatDate, safeColor } from '@/lib/utils';

function ScriptFormModal({ script, onClose }: { script?: Script | null; onClose: () => void }) {
  const { data, addScript, updateScript } = useData();
  const { toast } = useUI();
  const edicao = Boolean(script);
  const [nome, setNome] = useState(script ? script.nome : '');
  const [linguagem, setLinguagem] = useState(script ? script.linguagem : 'Bash');
  const [secaoId, setSecaoId] = useState(script ? script.secaoId : '');
  const [descricao, setDescricao] = useState(script ? script.descricao : '');
  const [codigo, setCodigo] = useState(script ? script.codigo : '');

  const salvar = () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome do script.', 'error');
      return;
    }
    const dados = {
      nome: valorNome,
      linguagem,
      secaoId,
      descricao: descricao.trim(),
      codigo
    };
    if (script) {
      updateScript(script.id, dados);
      toast('Script atualizado.');
    } else {
      addScript(dados);
      toast('Script criado.');
    }
    onClose();
  };

  return (
    <Modal
      title={edicao ? 'Editar script' : 'Novo script'}
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={salvar}>
            Salvar
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="script-nome">Nome *</label>
          <input
            className="input"
            id="script-nome"
            type="text"
            maxLength={80}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: backup-nas.sh"
          />
        </div>
        <div className="field">
          <label htmlFor="script-linguagem">Linguagem</label>
          <select
            className="select"
            id="script-linguagem"
            value={linguagem}
            onChange={(event) => setLinguagem(event.target.value)}
          >
            {LINGUAGENS.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="field span-2">
          <label htmlFor="script-secao">Seção</label>
          <select
            className="select"
            id="script-secao"
            value={secaoId}
            onChange={(event) => setSecaoId(event.target.value)}
          >
            <option value="">Sem seção</option>
            {data.secoes.map((secao) => (
              <option value={secao.id} key={secao.id}>
                {secao.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field span-2">
          <label htmlFor="script-descricao">Descrição</label>
          <input
            className="input"
            id="script-descricao"
            type="text"
            maxLength={160}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Para que serve este script"
          />
        </div>
        <div className="field span-2">
          <label htmlFor="script-codigo">Código</label>
          <textarea
            className="textarea textarea-code"
            id="script-codigo"
            spellCheck={false}
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            placeholder="Cole o código aqui"
          />
        </div>
      </div>
    </Modal>
  );
}

export default function ScriptsView() {
  const { data, removeScript } = useData();
  const { toast, confirm } = useUI();
  const [busca, setBusca] = useState('');
  const [linguagem, setLinguagem] = useState('');
  const [secaoId, setSecaoId] = useState('');
  const [formulario, setFormulario] = useState<{ script: Script | null } | null>(null);

  const termo = busca.trim().toLowerCase();

  const lista = data.scripts.filter((script) => {
    if (linguagem && script.linguagem !== linguagem) return false;
    if (secaoId && script.secaoId !== secaoId) return false;
    if (termo) {
      const alvo = (script.nome + ' ' + script.descricao + ' ' + script.codigo).toLowerCase();
      if (alvo.indexOf(termo) === -1) return false;
    }
    return true;
  });

  const copiar = (texto: string) => {
    const fallback = () => {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
      toast(ok ? 'Copiado!' : 'Não foi possível copiar.', ok ? 'success' : 'error');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(
        () => {
          toast('Copiado!');
        },
        fallback
      );
      return;
    }
    fallback();
  };

  const excluir = async (script: Script) => {
    const ok = await confirm({
      title: 'Excluir script',
      message: 'Excluir o script "' + script.nome + '"?',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    removeScript(script.id);
    toast('Script excluído.');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Scripts</h2>
          <p>Automações e comandos úteis do dia a dia.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" type="button" onClick={() => setFormulario({ script: null })}>
            Novo script
          </button>
        </div>
      </div>
      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="scripts-busca">Buscar</label>
          <input
            className="input"
            id="scripts-busca"
            type="search"
            placeholder="Nome, descrição ou código"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="scripts-linguagem">Linguagem</label>
          <select
            className="select"
            id="scripts-linguagem"
            value={linguagem}
            onChange={(event) => setLinguagem(event.target.value)}
          >
            <option value="">Todas</option>
            {LINGUAGENS.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="scripts-secao">Seção</label>
          <select
            className="select"
            id="scripts-secao"
            value={secaoId}
            onChange={(event) => setSecaoId(event.target.value)}
          >
            <option value="">Todas as seções</option>
            {data.secoes.map((secao) => (
              <option value={secao.id} key={secao.id}>
                {secao.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-scripts" id="scripts-lista">
        {lista.length ? (
          lista.map((script) => {
            const secao = data.secoes.find((item) => item.id === script.secaoId);
            return (
              <article className="card script-card" data-id={script.id} key={script.id}>
                <div className="script-head">
                  <h3>{script.nome}</h3>
                  <span className="badge">{script.linguagem}</span>
                </div>
                <div className="script-body">
                  <p>{script.descricao || 'Sem descrição.'}</p>
                  <div>
                    {secao ? (
                      <span
                        className="badge"
                        style={{ background: safeColor(secao.cor) + '22', color: safeColor(secao.cor) }}
                      >
                        {secao.nome}
                      </span>
                    ) : (
                      <span className="badge">Sem seção</span>
                    )}
                  </div>
                </div>
                <pre className="script-code">
                  <code>{script.codigo}</code>
                </pre>
                <div className="script-foot">
                  <span className="small muted">Atualizado em {formatDate(script.atualizadoEm)}</span>
                  <span className="group">
                    <button className="btn btn-sm" type="button" onClick={() => copiar(script.codigo)}>
                      Copiar
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      type="button"
                      onClick={() => setFormulario({ script })}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-ghost btn-icon-danger"
                      type="button"
                      onClick={() => excluir(script)}
                    >
                      Excluir
                    </button>
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty">Nenhum script encontrado.</p>
        )}
      </div>
      {formulario ? (
        <ScriptFormModal script={formulario.script} onClose={() => setFormulario(null)} />
      ) : null}
    </>
  );
}
