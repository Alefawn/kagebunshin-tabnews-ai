'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { podeGerenciarDivisoes, podeGerenciarSecao } from '@/lib/permissoes';
import { countsSecao } from '@/lib/store';
import type { Divisao, Secao } from '@/lib/types';
import { mensagemErro, safeColor } from '@/lib/utils';

export function DivisaoFormModal({ divisao, onClose }: { divisao?: Divisao | null; onClose: () => void }) {
  const { addDivisao, updateDivisao } = useData();
  const { toast } = useUI();
  const edicao = Boolean(divisao);
  const [nome, setNome] = useState(divisao ? divisao.nome : '');
  const [descricao, setDescricao] = useState(divisao ? divisao.descricao : '');
  const [cor, setCor] = useState(safeColor(divisao ? divisao.cor : '#2563eb'));
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da divisão.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dados = { nome: valorNome, descricao: descricao.trim(), cor };
      if (divisao) {
        await updateDivisao(divisao.id, dados);
        toast('Divisão atualizada.');
      } else {
        await addDivisao(dados);
        toast('Divisão criada.');
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
      title={edicao ? 'Editar divisão' : 'Nova divisão'}
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
        <div className="field span-2">
          <label htmlFor="divisao-nome">Nome *</label>
          <input
            className="input"
            id="divisao-nome"
            type="text"
            maxLength={60}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Tecnologia da Informação"
          />
        </div>
        <div className="field span-2">
          <label htmlFor="divisao-descricao">Descrição</label>
          <textarea
            className="textarea"
            id="divisao-descricao"
            maxLength={240}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Resumo da divisão"
          />
        </div>
        <div className="field">
          <label htmlFor="divisao-cor">Cor</label>
          <input
            className="color-input"
            id="divisao-cor"
            type="color"
            value={cor}
            onChange={(event) => setCor(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

export function SecaoFormModal({
  secao,
  divisaoId,
  onClose
}: {
  secao?: Secao | null;
  divisaoId?: string;
  onClose: () => void;
}) {
  const { dados, usuario, addSecao, updateSecao } = useData();
  const { toast } = useUI();
  const edicao = Boolean(secao);
  const gerenciaveis = dados.divisoes.filter((divisao) => podeGerenciarSecao(usuario, divisao.id));
  const [divisao, setDivisao] = useState(
    secao ? secao.divisaoId : divisaoId || (gerenciaveis[0] ? gerenciaveis[0].id : '')
  );
  const [nome, setNome] = useState(secao ? secao.nome : '');
  const [descricao, setDescricao] = useState(secao ? secao.descricao : '');
  const [responsavel, setResponsavel] = useState(secao ? secao.responsavel : '');
  const [cor, setCor] = useState(safeColor(secao ? secao.cor : '#2563eb'));
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da seção.', 'error');
      return;
    }
    if (!divisao) {
      toast('Informe a divisão da seção.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dadosSecao = {
        nome: valorNome,
        descricao: descricao.trim(),
        responsavel: responsavel.trim(),
        cor
      };
      if (secao) {
        await updateSecao(secao.id, dadosSecao);
        toast('Seção atualizada.');
      } else {
        await addSecao({ ...dadosSecao, divisaoId: divisao });
        toast('Seção criada.');
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
      title={edicao ? 'Editar seção' : 'Nova seção'}
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
        <div className="field span-2">
          <label htmlFor="secao-divisao">Divisão *</label>
          <select
            className="select"
            id="secao-divisao"
            value={divisao}
            disabled={edicao}
            onChange={(event) => setDivisao(event.target.value)}
          >
            {gerenciaveis.map((item) => (
              <option value={item.id} key={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>
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
  const { dados, usuario, removeSecao, removeDivisao } = useData();
  const { toast, confirm } = useUI();
  const [busca, setBusca] = useState('');
  const [formulario, setFormulario] = useState<{ secao: Secao | null; divisaoId?: string } | null>(null);
  const [divisaoForm, setDivisaoForm] = useState<{ divisao: Divisao | null } | null>(null);

  const termo = busca.trim().toLowerCase();
  const lista = dados.secoes.filter((secao) => !termo || secao.nome.toLowerCase().indexOf(termo) !== -1);
  const podeCriarDivisao = podeGerenciarDivisoes(usuario);

  const excluirSecao = async (secao: Secao) => {
    const counts = countsSecao(dados, secao.id);
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
    try {
      await removeSecao(secao.id);
      toast('Seção excluída.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    }
  };

  const excluirDivisao = async (divisao: Divisao) => {
    const ok = await confirm({
      title: 'Excluir divisão',
      message: 'Excluir a divisão "' + divisao.nome + '"?',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      await removeDivisao(divisao.id);
      toast('Divisão excluída.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Seções</h2>
          <p>Áreas de TI com suas missões, páginas e scripts.</p>
        </div>
        <div className="page-actions">
          {podeCriarDivisao ? (
            <button className="btn" type="button" onClick={() => setDivisaoForm({ divisao: null })}>
              Nova divisão
            </button>
          ) : null}
          {dados.divisoes.some((divisao) => podeGerenciarSecao(usuario, divisao.id)) ? (
            <button className="btn btn-primary" type="button" onClick={() => setFormulario({ secao: null })}>
              Nova seção
            </button>
          ) : null}
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
      {dados.divisoes.length ? (
        dados.divisoes.map((divisao) => {
          const secoes = lista.filter((secao) => secao.divisaoId === divisao.id);
          const gerencia = podeGerenciarSecao(usuario, divisao.id);
          return (
            <section className="divisao-group" key={divisao.id} data-divisao={divisao.id}>
              <header className="divisao-head" style={{ borderLeftColor: safeColor(divisao.cor) }}>
                <div className="divisao-info">
                  <h3>{divisao.nome}</h3>
                  <p>{divisao.descricao || 'Sem descrição.'}</p>
                </div>
                <div className="group">
                  {gerencia ? (
                    <button
                      className="btn btn-sm"
                      type="button"
                      onClick={() => setFormulario({ secao: null, divisaoId: divisao.id })}
                    >
                      Nova seção
                    </button>
                  ) : null}
                  {podeCriarDivisao ? (
                    <>
                      <button
                        className="icon-btn"
                        type="button"
                        onClick={() => setDivisaoForm({ divisao })}
                        aria-label={'Editar divisão ' + divisao.nome}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                          <path d="m14 6 4 4" />
                        </svg>
                      </button>
                      <button
                        className="icon-btn btn-icon-danger"
                        type="button"
                        onClick={() => excluirDivisao(divisao)}
                        aria-label={'Excluir divisão ' + divisao.nome}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16" />
                          <path d="M9 7V4h6v3" />
                          <path d="M6 7l1 13h10l1-13" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>
              </header>
              <div className="grid grid-secoes" id="secoes-grid">
                {secoes.length ? (
                  secoes.map((secao) => {
                    const counts = countsSecao(dados, secao.id);
                    const cor = safeColor(secao.cor);
                    const propria = usuario.secaoId === secao.id;
                    return (
                      <article className="card secao-card" data-id={secao.id} key={secao.id}>
                        <div className="secao-stripe" style={{ background: cor }} />
                        <div className="secao-body">
                          <h3>{secao.nome}</h3>
                          <p>{secao.descricao || 'Sem descrição.'}</p>
                          <div className="secao-meta">
                            {propria ? <span className="badge badge-accent">Sua seção</span> : null}
                            <span className="badge">{secao.responsavel || 'Sem responsável'}</span>
                            <span className="badge">{counts.missoes} missões</span>
                            <span className="badge">{counts.wiki} wiki</span>
                            <span className="badge">{counts.scripts} scripts</span>
                          </div>
                        </div>
                        <div className="secao-foot">
                          <Link
                            className="btn btn-sm btn-ghost"
                            href={'/missoes?secao=' + encodeURIComponent(secao.id)}
                          >
                            Ver missões
                          </Link>
                          <span>
                            {gerencia ? (
                              <>
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
                                  onClick={() => excluirSecao(secao)}
                                  aria-label={'Excluir seção ' + secao.nome}
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 7h16" />
                                    <path d="M9 7V4h6v3" />
                                    <path d="M6 7l1 13h10l1-13" />
                                    <path d="M10 11v6M14 11v6" />
                                  </svg>
                                </button>
                              </>
                            ) : null}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="empty">Nenhuma seção encontrada.</p>
                )}
              </div>
            </section>
          );
        })
      ) : (
        <p className="empty">Nenhuma divisão disponível.</p>
      )}
      {formulario ? (
        <SecaoFormModal
          secao={formulario.secao}
          divisaoId={formulario.divisaoId}
          onClose={() => setFormulario(null)}
        />
      ) : null}
      {divisaoForm ? (
        <DivisaoFormModal divisao={divisaoForm.divisao} onClose={() => setDivisaoForm(null)} />
      ) : null}
    </>
  );
}
