'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { PRIORIDADES, PRIORIDADE_VALORES, byOrdem, lastColumnId } from '@/lib/store';
import type { Coluna, Missao, Prioridade } from '@/lib/types';
import { formatDate, safeColor, todayISO } from '@/lib/utils';

export function MissaoFormModal({
  missao,
  colunaId,
  onClose
}: {
  missao?: Missao | null;
  colunaId?: string;
  onClose: () => void;
}) {
  const { data, addMissao, updateMissao, removeMissao } = useData();
  const { toast, confirm } = useUI();
  const edicao = Boolean(missao);
  const colunaAtual = missao ? missao.colunaId : colunaId || (data.colunas[0] ? data.colunas[0].id : '');
  const [titulo, setTitulo] = useState(missao ? missao.titulo : '');
  const [descricao, setDescricao] = useState(missao ? missao.descricao : '');
  const [secaoId, setSecaoId] = useState(missao ? missao.secaoId : '');
  const [coluna, setColuna] = useState(colunaAtual);
  const [prioridade, setPrioridade] = useState<Prioridade>(missao ? missao.prioridade : 'media');
  const [responsavel, setResponsavel] = useState(missao ? missao.responsavel : '');
  const [prazo, setPrazo] = useState(missao ? missao.prazo : '');

  const salvar = () => {
    const valorTitulo = titulo.trim();
    if (!valorTitulo) {
      toast('Informe o título da missão.', 'error');
      return;
    }
    const dados = {
      titulo: valorTitulo,
      descricao: descricao.trim(),
      secaoId,
      colunaId: coluna,
      prioridade,
      responsavel: responsavel.trim(),
      prazo
    };
    if (missao) {
      updateMissao(missao.id, dados);
      toast('Missão atualizada.');
    } else {
      addMissao(dados);
      toast('Missão criada.');
    }
    onClose();
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
    removeMissao(missao.id);
    toast('Missão excluída.');
    onClose();
  };

  return (
    <Modal
      title={edicao ? 'Editar missão' : 'Nova missão'}
      wide
      onClose={onClose}
      footer={
        <>
          {edicao ? (
            <button type="button" className="btn btn-danger" onClick={excluir}>
              Excluir
            </button>
          ) : null}
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
          <label htmlFor="missao-titulo">Título *</label>
          <input
            className="input"
            id="missao-titulo"
            type="text"
            maxLength={90}
            value={titulo}
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
        <div className="field">
          <label htmlFor="missao-coluna">Coluna</label>
          <select
            className="select"
            id="missao-coluna"
            value={coluna}
            onChange={(event) => setColuna(event.target.value)}
          >
            {data.colunas.map((item) => (
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

  const salvar = () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da coluna.', 'error');
      return;
    }
    updateColuna(coluna.id, { nome: valorNome });
    toast('Coluna renomeada.');
    onClose();
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
          <button type="button" className="btn btn-primary" onClick={salvar}>
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

  const salvar = () => {
    updateColuna(coluna.id, { cor });
    toast('Cor atualizada.');
    onClose();
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
          <button type="button" className="btn btn-primary" onClick={salvar}>
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

  const adicionar = () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome da coluna.', 'error');
      return;
    }
    addColuna(valorNome, cor);
    toast('Coluna adicionada.');
    onClose();
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
          <button type="button" className="btn btn-primary" onClick={adicionar}>
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
  const { data, moveColuna, removeColuna, moveMissao } = useData();
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
  const ultimaColuna = lastColumnId(data);

  const missoesDaColuna = (colunaId: string) => {
    return data.missoes
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
    const missao = data.missoes.find((item) => item.id === id);
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
    moveMissao(id, colunaId, indice);
    dragIdRef.current = null;
    setDragId(null);
    setDropTarget(null);
    ultimoDrag.current = Date.now();
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
    const total = data.missoes.filter((missao) => missao.colunaId === coluna.id).length;
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
    removeColuna(coluna.id);
    toast('Coluna excluída.');
  };

  const renderCard = (missao: Missao) => {
    const secao = data.secoes.find((item) => item.id === missao.secaoId);
    const atrasada = Boolean(missao.prazo) && missao.prazo < todayISO() && missao.colunaId !== ultimaColuna;
    const cor = secao ? safeColor(secao.cor) : '';
    return (
      <article
        className={'mission-card' + (dragId === missao.id ? ' dragging' : '')}
        draggable
        tabIndex={0}
        role="button"
        data-id={missao.id}
        key={missao.id}
        aria-label={'Editar missão ' + missao.titulo}
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
                moveColuna(coluna.id, -1);
              }}
            >
              Mover para a esquerda
            </button>
            <button
              type="button"
              disabled={indice === data.colunas.length - 1}
              onClick={() => {
                setMenuAberto(null);
                moveColuna(coluna.id, 1);
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
        <button
          className="btn btn-ghost btn-sm btn-block"
          type="button"
          onClick={() => setFormulario({ missao: null, colunaId: coluna.id })}
        >
          + Nova missão
        </button>
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
          <button className="btn btn-primary" type="button" onClick={() => setFormulario({ missao: null })}>
            + Nova missão
          </button>
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
            {data.secoes.map((secao) => (
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
        {data.colunas.map((coluna, indice) => renderColuna(coluna, indice))}
        <button className="btn btn-ghost column-add" type="button" onClick={() => setNovaColuna(true)}>
          + Adicionar coluna
        </button>
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
