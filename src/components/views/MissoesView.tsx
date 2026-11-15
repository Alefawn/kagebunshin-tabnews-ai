'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { podeCriarItem, podeEditarItem, podeExcluirItem, podeGerenciarColunas } from '@/lib/permissoes';
import { PRIORIDADES, PRIORIDADE_VALORES, byOrdem, lastColumnId } from '@/lib/store';
import type { Coluna, Missao, Prioridade } from '@/lib/types';
import { formatDate, mensagemErro, safeColor, todayISO } from '@/lib/utils';

export function MissaoFormModal({
  missao,
  colunaId,
  onClose
}: {
  missao?: Missao | null;
  colunaId?: string;
  onClose: () => void;
}) {
  const { dados, usuario, addMissao, updateMissao, removeMissao } = useData();
  const { toast, confirm } = useUI();
  const edicao = Boolean(missao);
  const editavel = missao ? podeEditarItem(usuario, missao) : true;
  const podeExcluir = missao ? podeExcluirItem(usuario, missao) : false;
  const colunaAtual = missao ? missao.colunaId : colunaId || (dados.colunas[0] ? dados.colunas[0].id : '');

  const opcoesSecao = dados.secoes.filter((item) =>
    podeCriarItem(usuario, { divisaoId: item.divisaoId, secaoId: item.id })
  );
  const secaoAtual =
    missao && missao.secaoId && !opcoesSecao.some((item) => item.id === missao.secaoId)
      ? dados.secoes.find((item) => item.id === missao.secaoId)
      : undefined;
  const secoes = secaoAtual ? [secaoAtual, ...opcoesSecao] : opcoesSecao;
  const divisoesSemSecao = dados.divisoes.filter((item) =>
    podeCriarItem(usuario, { divisaoId: item.id, secaoId: '' })
  );
  const permiteSemSecao = divisoesSemSecao.length > 0;

  const [titulo, setTitulo] = useState(missao ? missao.titulo : '');
  const [descricao, setDescricao] = useState(missao ? missao.descricao : '');
  const [secaoId, setSecaoId] = useState(
    missao ? missao.secaoId : permiteSemSecao ? '' : secoes[0] ? secoes[0].id : ''
  );
  const [divisaoId, setDivisaoId] = useState(
    missao ? missao.divisaoId : usuario.divisaoId || (divisoesSemSecao[0] ? divisoesSemSecao[0].id : '')
  );
  const [coluna, setColuna] = useState(colunaAtual);
  const [prioridade, setPrioridade] = useState<Prioridade>(missao ? missao.prioridade : 'media');
  const [responsavel, setResponsavel] = useState(missao ? missao.responsavel : '');
  const [prazo, setPrazo] = useState(missao ? missao.prazo : '');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorTitulo = titulo.trim();
    if (!valorTitulo) {
      toast('Informe o título da missão.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dadosMissao = {
        titulo: valorTitulo,
        descricao: descricao.trim(),
        secaoId,
        divisaoId: secaoId ? undefined : divisaoId,
        colunaId: coluna,
        prioridade,
        responsavel: responsavel.trim(),
        prazo
      };
      if (missao) {
        await updateMissao(missao.id, dadosMissao);
        toast('Missão atualizada.');
      } else {
        await addMissao(dadosMissao);
        toast('Missão criada.');
      }
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!missao) return;
    const ok = await confirm({
      title: 'Excluir missão',
      message: 'Excluir a missão "' + missao.titulo + '"?',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      await removeMissao(missao.id);
      toast('Missão excluída.');
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    }
  };

  return (
    <Modal
      title={edicao ? (editavel ? 'Editar missão' : 'Missão') : 'Nova missão'}
      wide
      onClose={onClose}
      footer={
        editavel ? (
          <>
            {podeExcluir ? (
              <button type="button" className="btn btn-danger" onClick={excluir}>
                Excluir
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
              Salvar
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        )
      }
    >
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="missao-titulo">Título *</label>
          <input
            className="input"
            id="missao-titulo"
            type="text"
            maxLength={90}
            value={titulo}
            disabled={!editavel}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: Revisar regras do firewall"
          />
        </div>
        <div className="field span-2">
          <label htmlFor="missao-descricao">Descrição</label>
          <textarea
            className="textarea"
            id="missao-descricao"
            maxLength={400}
            value={descricao}
            disabled={!editavel}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Detalhes da missão"
          />
        </div>
        <div className="field">
          <label htmlFor="missao-secao">Seção</label>
          <select
            className="select"
            id="missao-secao"
            value={secaoId}
            disabled={!editavel}
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
            <label htmlFor="missao-divisao">Divisão</label>
            <select
              className="select"
              id="missao-divisao"
              value={divisaoId}
              disabled={!editavel}
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
        <div className="field">
          <label htmlFor="missao-coluna">Coluna</label>
          <select
            className="select"
            id="missao-coluna"
            value={coluna}
            disabled={!editavel}
            onChange={(event) => setColuna(event.target.value)}
          >
            {dados.colunas.map((item) => (
              <option value={item.id} key={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="missao-prioridade">Prioridade</label>
          <select
            className="select"
            id="missao-prioridade"
            value={prioridade}
            disabled={!editavel}
            onChange={(event) => setPrioridade(event.target.value as Prioridade)}
          >
            {PRIORIDADE_VALORES.map((valor) => (
              <option value={valor} key={valor}>
                {PRIORIDADES[valor]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="missao-responsavel">Responsável</label>
          <input
            className="input"
            id="missao-responsavel"
            type="text"
            maxLength={60}
            value={responsavel}
            disabled={!editavel}
            onChange={(event) => setResponsavel(event.target.value)}
            placeholder="Nome do responsável"
          />
        </div>
        <div className="field">
          <label htmlFor="missao-prazo">Prazo</label>
          <input
            className="input"
            id="missao-prazo"
            type="date"
            value={prazo}
            disabled={!editavel}
            onChange={(event) => setPrazo(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function ColunaNomeModal({ coluna, onClose }: { coluna: Coluna; onClose: () => void }) {
  const { updateColuna } = useData();
  const { toast } = useUI();
  const [nome, setNome] = useState(coluna.nome);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da coluna.', 'error');
      return;
    }
    setSalvando(true);
    try {
      await updateColuna(coluna.id, { nome: valorNome });
      toast('Coluna renomeada.');
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      title="Renomear coluna"
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
      <div className="field">
        <label htmlFor="coluna-nome">Nome</label>
        <input
          className="input"
          id="coluna-nome"
          type="text"
          maxLength={40}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
        />
      </div>
    </Modal>
  );
}

function ColunaCorModal({ coluna, onClose }: { coluna: Coluna; onClose: () => void }) {
  const { updateColuna } = useData();
  const { toast } = useUI();
  const [cor, setCor] = useState(safeColor(coluna.cor));
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    try {
      await updateColuna(coluna.id, { cor });
      toast('Cor atualizada.');
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      title="Cor da coluna"
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
      <div className="field">
        <label htmlFor="coluna-cor">Cor</label>
        <input
          className="color-input"
          id="coluna-cor"
          type="color"
          value={cor}
          onChange={(event) => setCor(event.target.value)}
        />
      </div>
    </Modal>
  );
}

function NovaColunaModal({ onClose }: { onClose: () => void }) {
  const { addColuna } = useData();
  const { toast } = useUI();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#64748b');
  const [salvando, setSalvando] = useState(false);

  const adicionar = async () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da coluna.', 'error');
      return;
    }
    setSalvando(true);
    try {
      await addColuna(valorNome, cor);
      toast('Coluna adicionada.');
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      title="Adicionar coluna"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={adicionar} disabled={salvando}>
            Adicionar
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="nova-coluna-nome">Nome *</label>
          <input
            className="input"
            id="nova-coluna-nome"
            type="text"
            maxLength={40}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Aguardando terceiros"
          />
        </div>
        <div className="field">
          <label htmlFor="nova-coluna-cor">Cor</label>
          <input
            className="color-input"
            id="nova-coluna-cor"
            type="color"
            value={cor}
            onChange={(event) => setCor(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function MissoesView() {
  const searchParams = useSearchParams();
  const secaoParam = searchParams.get('secao') || '';
  const { dados, usuario, moveColuna, removeColuna, moveMissao } = useData();
  const { toast, confirm } = useUI();
  const [filtroSecao, setFiltroSecao] = useState(secaoParam);
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [busca, setBusca] = useState('');
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ colunaId: string; index: number } | null>(null);
  const [formulario, setFormulario] = useState<{ missao: Missao | null; colunaId?: string } | null>(null);
  const [colunaForm, setColunaForm] = useState<{ modo: 'renomear' | 'cor'; coluna: Coluna } | null>(null);
  const [novaColuna, setNovaColuna] = useState(false);
  const dragIdRef = useRef<string | null>(null);
  const ultimoDrag = useRef(0);

  useEffect(() => {
    setFiltroSecao(secaoParam);
  }, [secaoParam]);

  useEffect(() => {
    if (!menuAberto) return;
    const aoClicar = (event: MouseEvent) => {
      const alvo = event.target as HTMLElement | null;
      if (alvo && typeof alvo.closest === 'function' && alvo.closest('.column-head')) return;
      setMenuAberto(null);
    };
    document.addEventListener('click', aoClicar);
    return () => document.removeEventListener('click', aoClicar);
  }, [menuAberto]);

  const termo = busca.trim().toLowerCase();
  const ultimaColuna = lastColumnId(dados);
  const gerenciaColunas = podeGerenciarColunas(usuario);
  const podeCriarMissao =
    dados.secoes.some((secao) => podeCriarItem(usuario, { divisaoId: secao.divisaoId, secaoId: secao.id })) ||
    dados.divisoes.some((divisao) => podeCriarItem(usuario, { divisaoId: divisao.id, secaoId: '' }));

  const missoesDaColuna = (colunaId: string) => {
    return dados.missoes
      .filter((missao) => {
        if (missao.colunaId !== colunaId) return false;
        if (filtroSecao && missao.secaoId !== filtroSecao) return false;
        if (filtroPrioridade && missao.prioridade !== filtroPrioridade) return false;
        if (termo) {
          const alvo = (missao.titulo + ' ' + missao.descricao + ' ' + missao.responsavel).toLowerCase();
          if (alvo.indexOf(termo) === -1) return false;
        }
        return true;
      })
      .sort(byOrdem);
  };

  const abrirMissao = (id: string) => {
    if (Date.now() - ultimoDrag.current <= 200) return;
    const missao = dados.missoes.find((item) => item.id === id);
    if (missao) setFormulario({ missao });
  };

  const onDragStart = (event: DragEvent<HTMLElement>, missao: Missao) => {
    dragIdRef.current = missao.id;
    event.dataTransfer.effectAllowed = 'move';
    try {
      event.dataTransfer.setData('text/plain', missao.id);
    } catch {}
    window.setTimeout(() => setDragId(missao.id), 0);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>, colunaId: string) => {
    if (!dragIdRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const body = event.currentTarget;
    const cards = Array.from(body.querySelectorAll<HTMLElement>('.mission-card:not(.dragging)'));
    let indice = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        indice = i;
        break;
      }
    }
    setDropTarget({ colunaId, index: indice });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, colunaId: string) => {
    event.preventDefault();
    const id = dragIdRef.current;
    if (!id) return;
    const body = event.currentTarget;
    const fallback = body.querySelectorAll('.mission-card').length;
    const indice = dropTarget && dropTarget.colunaId === colunaId ? dropTarget.index : fallback;
    dragIdRef.current = null;
    setDragId(null);
    setDropTarget(null);
    ultimoDrag.current = Date.now();
    moveMissao(id, colunaId, indice).catch((erro) => toast(mensagemErro(erro), 'error'));
  };

  const onDragEnd = () => {
    dragIdRef.current = null;
    setDragId(null);
    setDropTarget(null);
    ultimoDrag.current = Date.now();
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>, colunaId: string) => {
    const body = event.currentTarget;
    const relacionado = event.relatedTarget as Node | null;
    if (relacionado && body.contains(relacionado)) return;
    setDropTarget((atual) => (atual && atual.colunaId === colunaId ? null : atual));
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    abrirMissao(id);
  };

  const excluirColuna = async (coluna: Coluna) => {
    const total = dados.missoes.filter((missao) => missao.colunaId === coluna.id).length;
    if (total > 0) {
      toast('Mova as ' + total + ' missão(ões) desta coluna antes de excluí-la.', 'error');
      return;
    }
    const ok = await confirm({
      title: 'Excluir coluna',
      message: 'Excluir a coluna "' + coluna.nome + '"?',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      await removeColuna(coluna.id);
      toast('Coluna excluída.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    }
  };

  const renderCard = (missao: Missao) => {
    const secao = dados.secoes.find((item) => item.id === missao.secaoId);
    const atrasada = Boolean(missao.prazo) && missao.prazo < todayISO() && missao.colunaId !== ultimaColuna;
    const cor = secao ? safeColor(secao.cor) : '';
    const editavel = podeEditarItem(usuario, missao);
    return (
      <article
        className={'mission-card' + (dragId === missao.id ? ' dragging' : '')}
        draggable={editavel}
        tabIndex={0}
        role="button"
        data-id={missao.id}
        key={missao.id}
        aria-label={(editavel ? 'Editar missão ' : 'Ver missão ') + missao.titulo}
        onClick={() => abrirMissao(missao.id)}
        onKeyDown={(event) => onCardKeyDown(event, missao.id)}
        onDragStart={(event) => onDragStart(event, missao)}
        onDragEnd={onDragEnd}
      >
        <div className="mission-top">
          <span className={'badge prio-' + missao.prioridade}>{PRIORIDADES[missao.prioridade] || 'Média'}</span>
          {secao ? (
            <span className="badge" style={{ background: cor + '22', color: cor }}>
              {secao.nome}
            </span>
          ) : (
            <span className="badge">Sem seção</span>
          )}
        </div>
        <h4>{missao.titulo}</h4>
        <div className="mission-foot">
          <span className="responsavel">{missao.responsavel || 'Sem responsável'}</span>
          {missao.prazo ? (
            <span className={atrasada ? 'overdue' : undefined}>{formatDate(missao.prazo)}</span>
          ) : null}
        </div>
      </article>
    );
  };

  const renderColuna = (coluna: Coluna, indice: number) => {
    const missoes = missoesDaColuna(coluna.id);
    const marcador = dropTarget && dropTarget.colunaId === coluna.id ? dropTarget.index : -1;
    const conteudo: ReactNode[] = [];
    let contador = 0;
    missoes.forEach((missao) => {
      if (marcador === contador) conteudo.push(<div className="drop-marker" key="drop-marker" />);
      conteudo.push(renderCard(missao));
      if (missao.id !== dragId) contador += 1;
    });
    if (marcador >= contador) conteudo.push(<div className="drop-marker" key="drop-marker-fim" />);

    return (
      <section className="column" data-coluna={coluna.id} key={coluna.id}>
        <header className="column-head">
          <span className="dot" style={{ background: safeColor(coluna.cor) }} />
          <h3>{coluna.nome}</h3>
          <span className="count">{missoes.length}</span>
          {gerenciaColunas ? (
            <>
              <button
                className="icon-btn"
                type="button"
                onClick={() => setMenuAberto((atual) => (atual === coluna.id ? null : coluna.id))}
                aria-label={'Ações da coluna ' + coluna.nome}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="5" cy="12" r="1.4" />
                  <circle cx="12" cy="12" r="1.4" />
                  <circle cx="19" cy="12" r="1.4" />
                </svg>
              </button>
              <div className={'menu' + (menuAberto === coluna.id ? ' open' : '')} role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(null);
                    setColunaForm({ modo: 'renomear', coluna });
                  }}
                >
                  Renomear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(null);
                    setColunaForm({ modo: 'cor', coluna });
                  }}
                >
                  Mudar cor
                </button>
                <button
                  type="button"
                  disabled={indice === 0}
                  onClick={() => {
                    setMenuAberto(null);
                    moveColuna(coluna.id, -1).catch((erro) => toast(mensagemErro(erro), 'error'));
                  }}
                >
                  Mover para a esquerda
                </button>
                <button
                  type="button"
                  disabled={indice === dados.colunas.length - 1}
                  onClick={() => {
                    setMenuAberto(null);
                    moveColuna(coluna.id, 1).catch((erro) => toast(mensagemErro(erro), 'error'));
                  }}
                >
                  Mover para a direita
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setMenuAberto(null);
                    excluirColuna(coluna);
                  }}
                >
                  Excluir coluna
                </button>
              </div>
            </>
          ) : null}
        </header>
        <div
          className={'column-body' + (dropTarget && dropTarget.colunaId === coluna.id ? ' drop-target' : '')}
          data-coluna={coluna.id}
          onDragOver={(event) => onDragOver(event, coluna.id)}
          onDrop={(event) => onDrop(event, coluna.id)}
          onDragLeave={(event) => onDragLeave(event, coluna.id)}
        >
          {conteudo}
        </div>
        {podeCriarMissao ? (
          <button
            className="btn btn-ghost btn-sm btn-block"
            type="button"
            onClick={() => setFormulario({ missao: null, colunaId: coluna.id })}
          >
            + Nova missão
          </button>
        ) : null}
      </section>
    );
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Missões</h2>
          <p>Arraste os cartões entre as colunas para atualizar o andamento.</p>
        </div>
        <div className="page-actions">
          {podeCriarMissao ? (
            <button className="btn btn-primary" type="button" onClick={() => setFormulario({ missao: null })}>
              + Nova missão
            </button>
          ) : null}
        </div>
      </div>
      <div className="toolbar">
        <div className="field">
          <label htmlFor="filtro-secao">Seção</label>
          <select
            className="select"
            id="filtro-secao"
            value={filtroSecao}
            onChange={(event) => setFiltroSecao(event.target.value)}
          >
            <option value="">Todas as seções</option>
            {dados.secoes.map((secao) => (
              <option value={secao.id} key={secao.id}>
                {secao.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filtro-prioridade">Prioridade</label>
          <select
            className="select"
            id="filtro-prioridade"
            value={filtroPrioridade}
            onChange={(event) => setFiltroPrioridade(event.target.value)}
          >
            <option value="">Todas</option>
            {PRIORIDADE_VALORES.map((valor) => (
              <option value={valor} key={valor}>
                {PRIORIDADES[valor]}
              </option>
            ))}
          </select>
        </div>
        <div className="field grow">
          <label htmlFor="filtro-busca">Buscar</label>
          <input
            className="input"
            id="filtro-busca"
            type="search"
            placeholder="Título, descrição ou responsável"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
      </div>
      <div className="kanban" id="kanban">
        {dados.colunas.map((coluna, indice) => renderColuna(coluna, indice))}
        {gerenciaColunas ? (
          <button className="btn btn-ghost column-add" type="button" onClick={() => setNovaColuna(true)}>
            + Adicionar coluna
          </button>
        ) : null}
      </div>
      {formulario ? (
        <MissaoFormModal
          missao={formulario.missao}
          colunaId={formulario.colunaId}
          onClose={() => setFormulario(null)}
        />
      ) : null}
      {colunaForm && colunaForm.modo === 'renomear' ? (
        <ColunaNomeModal coluna={colunaForm.coluna} onClose={() => setColunaForm(null)} />
      ) : null}
      {colunaForm && colunaForm.modo === 'cor' ? (
        <ColunaCorModal coluna={colunaForm.coluna} onClose={() => setColunaForm(null)} />
      ) : null}
      {novaColuna ? <NovaColunaModal onClose={() => setNovaColuna(false)} /> : null}
    </>
  );
}
