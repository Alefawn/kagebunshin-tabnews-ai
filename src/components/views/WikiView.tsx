'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { renderMarkdown } from '@/lib/markdown';
import { podeCriarItem, podeEditarItem, podeExcluirItem } from '@/lib/permissoes';
import { secaoNome } from '@/lib/store';
import type { WikiPage } from '@/lib/types';
import { formatDate, mensagemErro, safeColor } from '@/lib/utils';

function WikiFormModal({
  pagina,
  onClose
}: {
  pagina?: WikiPage | null;
  onClose: (id?: string) => void;
}) {
  const { dados, usuario, addWiki, updateWiki } = useData();
  const { toast } = useUI();
  const edicao = Boolean(pagina);

  const opcoesSecao = dados.secoes.filter((item) =>
    podeCriarItem(usuario, { divisaoId: item.divisaoId, secaoId: item.id })
  );
  const secaoAtual =
    pagina && pagina.secaoId && !opcoesSecao.some((item) => item.id === pagina.secaoId)
      ? dados.secoes.find((item) => item.id === pagina.secaoId)
      : undefined;
  const secoes = secaoAtual ? [secaoAtual, ...opcoesSecao] : opcoesSecao;
  const divisoesSemSecao = dados.divisoes.filter((item) =>
    podeCriarItem(usuario, { divisaoId: item.id, secaoId: '' })
  );
  const permiteSemSecao = divisoesSemSecao.length > 0;

  const [titulo, setTitulo] = useState(pagina ? pagina.titulo : '');
  const [secaoId, setSecaoId] = useState(
    pagina ? pagina.secaoId : permiteSemSecao ? '' : secoes[0] ? secoes[0].id : ''
  );
  const [divisaoId, setDivisaoId] = useState(
    pagina ? pagina.divisaoId : usuario.divisaoId || (divisoesSemSecao[0] ? divisoesSemSecao[0].id : '')
  );
  const [conteudo, setConteudo] = useState(pagina ? pagina.conteudo : '');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorTitulo = titulo.trim();
    if (!valorTitulo) {
      toast('Informe o título da página.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dadosPagina = { titulo: valorTitulo, secaoId, divisaoId: secaoId ? undefined : divisaoId, conteudo };
      if (pagina) {
        await updateWiki(pagina.id, dadosPagina);
        toast('Página atualizada.');
        onClose(pagina.id);
      } else {
        const id = await addWiki(dadosPagina);
        toast('Página criada.');
        onClose(id);
      }
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      title={edicao ? 'Editar página' : 'Nova página'}
      wide
      onClose={() => onClose()}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => onClose()}>
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
          <label htmlFor="wiki-titulo">Título *</label>
          <input
            className="input"
            id="wiki-titulo"
            type="text"
            maxLength={90}
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: Como reiniciar o servidor de arquivos"
          />
        </div>
        <div className="field">
          <label htmlFor="wiki-secao">Seção</label>
          <select
            className="select"
            id="wiki-secao"
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
            <label htmlFor="wiki-divisao">Divisão</label>
            <select
              className="select"
              id="wiki-divisao"
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
          <label htmlFor="wiki-conteudo">Conteúdo</label>
          <textarea
            className="textarea textarea-code"
            id="wiki-conteudo"
            value={conteudo}
            onChange={(event) => setConteudo(event.target.value)}
            placeholder={'# Título\n\nTexto com **negrito**, `código` e listas.'}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function WikiView() {
  const { dados, usuario, removeWiki } = useData();
  const { toast, confirm } = useUI();
  const [selecionada, setSelecionada] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroSecao, setFiltroSecao] = useState('');
  const [formulario, setFormulario] = useState<{ pagina: WikiPage | null } | null>(null);

  const paginas = dados.wiki;
  const atual = paginas.find((item) => item.id === selecionada) || paginas[0] || null;
  const ativaId = atual ? atual.id : '';
  const termo = busca.trim().toLowerCase();
  const podeCriar =
    dados.secoes.some((secao) => podeCriarItem(usuario, { divisaoId: secao.divisaoId, secaoId: secao.id })) ||
    dados.divisoes.some((divisao) => podeCriarItem(usuario, { divisaoId: divisao.id, secaoId: '' }));

  const lista = paginas.filter((pagina) => {
    if (filtroSecao && pagina.secaoId !== filtroSecao) return false;
    if (termo && pagina.titulo.toLowerCase().indexOf(termo) === -1) return false;
    return true;
  });

  const excluir = async (pagina: WikiPage) => {
    const ok = await confirm({
      title: 'Excluir página',
      message: 'Excluir a página "' + pagina.titulo + '"?',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      await removeWiki(pagina.id);
      if (selecionada === pagina.id) setSelecionada('');
      toast('Página excluída.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    }
  };

  const secao = atual ? dados.secoes.find((item) => item.id === atual.secaoId) : undefined;
  const editavel = atual ? podeEditarItem(usuario, atual) : false;
  const excluivel = atual ? podeExcluirItem(usuario, atual) : false;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Wiki</h2>
          <p>Documentação interna com títulos, listas, negrito e blocos de código.</p>
        </div>
        <div className="page-actions">
          {podeCriar ? (
            <button className="btn btn-primary" type="button" onClick={() => setFormulario({ pagina: null })}>
              Nova página
            </button>
          ) : null}
        </div>
      </div>
      <div className="wiki-layout">
        <div className="card wiki-list">
          <div className="field">
            <label className="visually-hidden" htmlFor="wiki-busca">
              Buscar página
            </label>
            <input
              className="input"
              id="wiki-busca"
              type="search"
              placeholder="Buscar página"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="visually-hidden" htmlFor="wiki-filtro">
              Filtrar por seção
            </label>
            <select
              className="select"
              id="wiki-filtro"
              value={filtroSecao}
              onChange={(event) => setFiltroSecao(event.target.value)}
            >
              <option value="">Todas as seções</option>
              {dados.secoes.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="wiki-items" id="wiki-items">
            {lista.length ? (
              lista.map((pagina) => (
                <button
                  type="button"
                  className={'wiki-item' + (pagina.id === ativaId ? ' active' : '')}
                  data-id={pagina.id}
                  key={pagina.id}
                  onClick={() => setSelecionada(pagina.id)}
                >
                  <strong>{pagina.titulo}</strong>
                  <small>{secaoNome(dados, pagina.secaoId) || 'Sem seção'}</small>
                </button>
              ))
            ) : (
              <p className="empty">Nenhuma página encontrada.</p>
            )}
          </div>
        </div>
        <div className="card wiki-view" id="wiki-view">
          {atual ? (
            <>
              <div className="wiki-view-head">
                <div>
                  <h2>{atual.titulo}</h2>
                  <div className="meta">
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
                    <span>Atualizado em {formatDate(atual.atualizadoEm)}</span>
                  </div>
                </div>
                <div className="page-actions">
                  {editavel ? (
                    <button
                      className="btn btn-sm"
                      type="button"
                      onClick={() => setFormulario({ pagina: atual })}
                    >
                      Editar
                    </button>
                  ) : null}
                  {excluivel ? (
                    <button
                      className="btn btn-sm btn-ghost btn-icon-danger"
                      type="button"
                      onClick={() => excluir(atual)}
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
              </div>
              <div
                className="wiki-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(atual.conteudo) }}
              />
            </>
          ) : (
            <p className="empty">Nenhuma página na wiki. Crie a primeira página.</p>
          )}
        </div>
      </div>
      {formulario ? (
        <WikiFormModal
          pagina={formulario.pagina}
          onClose={(id) => {
            if (id) setSelecionada(id);
            setFormulario(null);
          }}
        />
      ) : null}
    </>
  );
}
