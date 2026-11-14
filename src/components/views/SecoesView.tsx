'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { countsSecao } from '@/lib/store';
import type { Secao } from '@/lib/types';
import { safeColor } from '@/lib/utils';

export function SecaoFormModal({ secao, onClose }: { secao?: Secao | null; onClose: () => void }) {
  const { addSecao, updateSecao } = useData();
  const { toast } = useUI();
  const edicao = Boolean(secao);
  const [nome, setNome] = useState(secao ? secao.nome : '');
  const [descricao, setDescricao] = useState(secao ? secao.descricao : '');
  const [responsavel, setResponsavel] = useState(secao ? secao.responsavel : '');
  const [cor, setCor] = useState(safeColor(secao ? secao.cor : '#2563eb'));

  const salvar = () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da seção.', 'error');
      return;
    }
    const dados = {
      nome: valorNome,
      descricao: descricao.trim(),
      responsavel: responsavel.trim(),
      cor
    };
    if (secao) {
      updateSecao(secao.id, dados);
      toast('Seção atualizada.');
    } else {
      addSecao(dados);
      toast('Seção criada.');
    }
    onClose();
  };

  return (
    <Modal
      title={edicao ? 'Editar seção' : 'Nova seção'}
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
        <div className="field span-2">
          <label htmlFor="secao-nome">Nome *</label>
          <input
            className="input"
            id="secao-nome"
            type="text"
            maxLength={60}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Infraestrutura"
          />
        </div>
        <div className="field span-2">
          <label htmlFor="secao-descricao">Descrição</label>
          <textarea
            className="textarea"
            id="secao-descricao"
            maxLength={240}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Resumo das responsabilidades"
          />
        </div>
        <div className="field">
          <label htmlFor="secao-responsavel">Responsável</label>
          <input
            className="input"
            id="secao-responsavel"
            type="text"
            maxLength={60}
            value={responsavel}
            onChange={(event) => setResponsavel(event.target.value)}
            placeholder="Nome do responsável"
          />
        </div>
        <div className="field">
          <label htmlFor="secao-cor">Cor</label>
          <input
            className="color-input"
            id="secao-cor"
            type="color"
            value={cor}
            onChange={(event) => setCor(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function SecoesView() {
  const { data, removeSecao } = useData();
  const { toast, confirm } = useUI();
  const [busca, setBusca] = useState('');
  const [formulario, setFormulario] = useState<{ secao: Secao | null } | null>(null);

  const termo = busca.trim().toLowerCase();
  const lista = data.secoes.filter((secao) => !termo || secao.nome.toLowerCase().indexOf(termo) !== -1);

  const excluir = async (secao: Secao) => {
    const counts = countsSecao(data, secao.id);
    const vinculados = counts.missoes + counts.wiki + counts.scripts;
    let mensagem = 'Excluir a seção "' + secao.nome + '"?';
    if (vinculados > 0) {
      mensagem +=
        ' ' +
        counts.missoes +
        ' missão(ões), ' +
        counts.wiki +
        ' página(s) da wiki e ' +
        counts.scripts +
        ' script(s) ficarão sem seção.';
    }
    const ok = await confirm({
      title: 'Excluir seção',
      message: mensagem,
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    removeSecao(secao.id);
    toast('Seção excluída.');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Seções</h2>
          <p>Áreas de TI com suas missões, páginas e scripts.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" type="button" onClick={() => setFormulario({ secao: null })}>
            Nova seção
          </button>
        </div>
      </div>
      <div className="toolbar">
        <div className="grow">
          <label className="visually-hidden" htmlFor="secoes-busca">
            Buscar seção
          </label>
          <input
            className="input"
            id="secoes-busca"
            type="search"
            placeholder="Buscar por nome"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-secoes" id="secoes-grid">
        {lista.length ? (
          lista.map((secao) => {
            const counts = countsSecao(data, secao.id);
            const cor = safeColor(secao.cor);
            return (
              <article className="card secao-card" data-id={secao.id} key={secao.id}>
                <div className="secao-stripe" style={{ background: cor }} />
                <div className="secao-body">
                  <h3>{secao.nome}</h3>
                  <p>{secao.descricao || 'Sem descrição.'}</p>
                  <div className="secao-meta">
                    <span className="badge">{secao.responsavel || 'Sem responsável'}</span>
                    <span className="badge">{counts.missoes} missões</span>
                    <span className="badge">{counts.wiki} wiki</span>
                    <span className="badge">{counts.scripts} scripts</span>
                  </div>
                </div>
                <div className="secao-foot">
                  <Link className="btn btn-sm btn-ghost" href={'/missoes?secao=' + encodeURIComponent(secao.id)}>
                    Ver missões
                  </Link>
                  <span>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setFormulario({ secao })}
                      aria-label={'Editar seção ' + secao.nome}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                        <path d="m14 6 4 4" />
                      </svg>
                    </button>
                    <button
                      className="icon-btn btn-icon-danger"
                      type="button"
                      onClick={() => excluir(secao)}
                      aria-label={'Excluir seção ' + secao.nome}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16" />
                        <path d="M9 7V4h6v3" />
                        <path d="M6 7l1 13h10l1-13" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty">Nenhuma seção encontrada.</p>
        )}
      </div>
      {formulario ? (
        <SecaoFormModal secao={formulario.secao} onClose={() => setFormulario(null)} />
      ) : null}
    </>
  );
}
