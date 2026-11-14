'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { PRIORIDADES, lastColumnId } from '@/lib/store';
import { formatDate, safeColor, todayISO } from '@/lib/utils';
import { SecaoFormModal } from './SecoesView';
import { MissaoFormModal } from './MissoesView';

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-hint">{hint}</span>
    </div>
  );
}

export default function InicioView() {
  const { data } = useData();
  const [secaoForm, setSecaoForm] = useState(false);
  const [missaoForm, setMissaoForm] = useState(false);

  const ultimaColuna = lastColumnId(data);
  const abertas = data.missoes.filter((missao) => missao.colunaId !== ultimaColuna).length;
  const concluidas = data.missoes.filter((missao) => missao.colunaId === ultimaColuna).length;
  const hoje = todayISO();
  const nome = data.profile.nome || 'gestor';

  const comPrazo = data.missoes
    .filter((missao) => missao.prazo)
    .sort((a, b) => (a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0))
    .slice(0, 6);

  const maximo = data.colunas.reduce((max, coluna) => {
    const total = data.missoes.filter((missao) => missao.colunaId === coluna.id).length;
    return Math.max(max, total);
  }, 0);

  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Olá, {nome}</h2>
          <p>{dataHoje} · visão geral das operações de TI</p>
        </div>
        <div className="page-actions">
          <button className="btn" type="button" onClick={() => setSecaoForm(true)}>
            Nova seção
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setMissaoForm(true)}>
            Nova missão
          </button>
        </div>
      </div>
      <div className="grid grid-stats">
        <StatCard label="Seções" value={data.secoes.length} hint="áreas de TI cadastradas" />
        <StatCard label="Missões abertas" value={abertas} hint="fora da última coluna" />
        <StatCard label="Missões concluídas" value={concluidas} hint="na última coluna" />
        <StatCard label="Páginas na wiki" value={data.wiki.length} hint="documentação interna" />
        <StatCard label="Scripts" value={data.scripts.length} hint="automações disponíveis" />
      </div>
      <div className="section-title">
        <h3>Missões por coluna</h3>
        <span>{data.missoes.length} no total</span>
      </div>
      <div className="card bars">
        {data.colunas.length ? (
          data.colunas.map((coluna) => {
            const total = data.missoes.filter((missao) => missao.colunaId === coluna.id).length;
            const largura = maximo ? Math.round((total / maximo) * 100) : 0;
            return (
              <div className="bar-row" key={coluna.id}>
                <span>{coluna.nome}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: largura + '%', background: safeColor(coluna.cor) }}
                  />
                </span>
                <span className="bar-count">{total}</span>
              </div>
            );
          })
        ) : (
          <p className="muted small">Nenhuma coluna cadastrada.</p>
        )}
      </div>
      <div className="section-title">
        <h3>Próximos prazos</h3>
        <span>ordenados por data</span>
      </div>
      <div className="card list">
        {comPrazo.length ? (
          comPrazo.map((missao) => {
            const atrasada = missao.prazo < hoje && missao.colunaId !== ultimaColuna;
            const secao = data.secoes.find((item) => item.id === missao.secaoId);
            return (
              <div className="list-item" key={missao.id}>
                <span className="grow">
                  <strong>{missao.titulo}</strong>
                  <small>
                    {(secao ? secao.nome : 'Sem seção') + ' · ' + (PRIORIDADES[missao.prioridade] || 'Média')}
                  </small>
                </span>
                {atrasada ? <span className="badge badge-danger">Atrasada</span> : null}
                <span className={'small ' + (atrasada ? 'overdue' : 'muted')}>{formatDate(missao.prazo)}</span>
              </div>
            );
          })
        ) : (
          <p className="empty">Nenhuma missão com prazo definido.</p>
        )}
      </div>
      {secaoForm ? <SecaoFormModal secao={null} onClose={() => setSecaoForm(false)} /> : null}
      {missaoForm ? <MissaoFormModal missao={null} onClose={() => setMissaoForm(false)} /> : null}
    </>
  );
}
