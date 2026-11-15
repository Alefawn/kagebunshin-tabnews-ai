'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { podeCriarItem, podeEditarItem, podeExcluirItem } from '@/lib/permissoes';
import { LINGUAGENS } from '@/lib/store';
import type { Script } from '@/lib/types';
import { formatDate, mensagemErro, safeColor } from '@/lib/utils';

function ScriptFormModal({ script, onClose }: { script?: Script | null; onClose: () => void }) {
  const { dados, usuario, addScript, updateScript } = useData();
  const { toast } = useUI();
  const edicao = Boolean(script);

  const opcoesSecao = dados.secoes.filter((item) =>
    podeCriarItem(usuario, { divisaoId: item.divisaoId, secaoId: item.id })
  );
  const secaoAtual =
    script && script.secaoId && !opcoesSecao.some((item) => item.id === script.secaoId)
      ? dados.secoes.find((item) => item.id === script.secaoId)
      : undefined;
  const secoes = secaoAtual ? [secaoAtual, ...opcoesSecao] : opcoesSecao;
  const divisoesSemSecao = dados.divisoes.filter((item) =>
    podeCriarItem(usuario, { divisaoId: item.id, secaoId: '' })
  );
  const permiteSemSecao = divisoesSemSecao.length > 0;

  const [nome, setNome] = useState(script ? script.nome : '');
  const [linguagem, setLinguagem] = useState(script ? script.linguagem : 'Bash');
  const [secaoId, setSecaoId] = useState(
    script ? script.secaoId : permiteSemSecao ? '' : secoes[0] ? secoes[0].id : ''
  );
  const [divisaoId, setDivisaoId] = useState(
    script ? script.divisaoId : usuario.divisaoId || (divisoesSemSecao[0] ? divisoesSemSecao[0].id : '')
  );
  const [descricao, setDescricao] = useState(script ? script.descricao : '');
  const [codigo, setCodigo] = useState(script ? script.codigo : '');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome do script.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dadosScript = {
        nome: valorNome,
        linguagem,
        secaoId,
        divisaoId: secaoId ? undefined : divisaoId,
        descricao: descricao.trim(),
        codigo
      };
      if (script) {
        await updateScript(script.id, dadosScript);
        toast('Script atualizado.');
      } else {
        await addScript(dadosScript);
        toast('Script criado.');
      }
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
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
          <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
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
        <div className="field">
          <label htmlFor="script-secao">Seção</label>
          <select
            className="select"
            id="script-secao"
            value={secaoId}
            onChange={(event) => setSecaoId(event.target.value)}
          >
            {permiteSemSecao ? <option value="">Sem seção</option> : null}
            {secoes.map((secao) => (
              <option value={secao.id} key={secao.id}>
                {secao.nome}
              </option>
            ))}
          </select>
        </div>
        {permiteSemSecao && !secaoId ? (
          <div className="field">
            <label htmlFor="script-divisao">Divisão</label>
            <select
              className="select"
              id="script-divisao"
              value={divisaoId}
              onChange={(event) => setDivisaoId(event.target.value)}
            >
              {divisoesSemSecao.map((divisao) => (
                <option value={divisao.id} key={divisao.id}>
                  {divisao.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
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
  const { dados, usuario, removeScript } = useData();
  const { toast, confirm } = useUI();
  const [busca, setBusca] = useState('');
  const [linguagem, setLinguagem] = useState('');
  const [secaoId, setSecaoId] = useState('');
  const [formulario, setFormulario] = useState<{ script: Script | null } | null>(null);

  const termo = busca.trim().toLowerCase();
  const podeCriar =
    dados.secoes.some((secao) => podeCriarItem(usuario, { divisaoId: secao.divisaoId, secaoId: secao.id })) ||
    dados.divisoes.some((divisao) => podeCriarItem(usuario, { divisaoId: divisao.id, secaoId: '' }));

  const lista = dados.scripts.filter((script) => {
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
    try {
      await removeScript(script.id);
      toast('Script excluído.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Scripts</h2>
          <p>Automações e comandos úteis do dia a dia.</p>
        </div>
        <div className="page-actions">
          {podeCriar ? (
            <button className="btn btn-primary" type="button" onClick={() => setFormulario({ script: null })}>
              Novo script
            </button>
          ) : null}
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
            {dados.secoes.map((secao) => (
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
            const secao = dados.secoes.find((item) => item.id === script.secaoId);
            const editavel = podeEditarItem(usuario, script);
            const excluivel = podeExcluirItem(usuario, script);
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
                    {editavel ? (
                      <button
                        className="btn btn-sm btn-ghost"
                        type="button"
                        onClick={() => setFormulario({ script })}
                      >
                        Editar
                      </button>
                    ) : null}
                    {excluivel ? (
                      <button
                        className="btn btn-sm btn-ghost btn-icon-danger"
                        type="button"
                        onClick={() => excluir(script)}
                      >
                        Excluir
                      </button>
                    ) : null}
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
