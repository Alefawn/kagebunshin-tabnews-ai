'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { podeCriarItem, podeGerenciarSecao } from '@/lib/permissoes';
import { PAPEIS, PRIORIDADES, lastColumnId } from '@/lib/store';
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
  const { dados, usuario } = useData();
  const [secaoForm, setSecaoForm] = useState(false);
  const [missaoForm, setMissaoForm] = useState(false);

  const ultimaColuna = lastColumnId(dados);
  const abertas = dados.missoes.filter((missao) => missao.colunaId !== ultimaColuna).length;
  const concluidas = dados.missoes.filter((missao) => missao.colunaId === ultimaColuna).length;
  const hoje = todayISO();
  const divisao = dados.divisoes.find((item) => item.id === usuario.divisaoId);
  const secao = dados.secoes.find((item) => item.id === usuario.secaoId);
  const pendente = usuario.papel !== 'admin' && !usuario.divisaoId;
  const podeCriarSecao = dados.divisoes.some((item) => podeGerenciarSecao(usuario, item.id));
  const podeCriarMissao =
    dados.secoes.some((item) => podeCriarItem(usuario, { divisaoId: item.divisaoId, secaoId: item.id })) ||
    dados.divisoes.some((item) => podeCriarItem(usuario, { divisaoId: item.id, secaoId: '' }));

  const comPrazo = dados.missoes
    .filter((missao) => missao.prazo)
    .sort((a, b) => (a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0))
    .slice(0, 6);

  const maximo = dados.colunas.reduce((max, coluna) => {
    const total = dados.missoes.filter((missao) => missao.colunaId === coluna.id).length;
    return Math.max(max, total);
  }, 0);

  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Olá, {usuario.nome || 'usuário'}</h2>
          <p>{dataHoje} · visão geral das operações de TI</p>
          <div className="badges">
            <span className={'badge badge-' + usuario.papel}>{PAPEIS[usuario.papel]}</span>
            {divisao ? <span className="badge">{divisao.nome}</span> : null}
            {secao ? <span className="badge">{secao.nome}</span> : null}
          </div>
        </div>
        <div className="page-actions">
          {podeCriarSecao ? (
            <button className="btn" type="button" onClick={() => setSecaoForm(true)}>
              Nova seção
            </button>
          ) : null}
          {podeCriarMissao ? (
            <button className="btn btn-primary" type="button" onClick={() => setMissaoForm(true)}>
              Nova missão
            </button>
          ) : null}
        </div>
      </div>
      {pendente ? (
        <div className="notice" role="status">
          <div>
            <strong>Conta pendente</strong>
            Sua conta aguarda atribuição a uma divisão e seção. Fale com um gestor ou administrador.
          </div>
        </div>
      ) : null}
      <div className="grid grid-stats">
        <StatCard label="Seções" value={dados.secoes.length} hint="áreas de TI cadastradas" />
        <StatCard label="Missões abertas" value={abertas} hint="fora da última coluna" />
        <StatCard label="Missões concluídas" value={concluidas} hint="na última coluna" />
        <StatCard label="Páginas na wiki" value={dados.wiki.length} hint="documentação interna" />
        <StatCard label="Scripts" value={dados.scripts.length} hint="automações disponíveis" />
      </div>
      <div className="section-title">
        <h3>Missões por coluna</h3>
        <span>{dados.missoes.length} no total</span>
      </div>
      <div className="card bars">
        {dados.colunas.length ? (
          dados.colunas.map((coluna) => {
            const total = dados.missoes.filter((missao) => missao.colunaId === coluna.id).length;
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
            const secaoMissao = dados.secoes.find((item) => item.id === missao.secaoId);
            return (
              <div className="list-item" key={missao.id}>
                <span className="grow">
                  <strong>{missao.titulo}</strong>
                  <small>
                    {(secaoMissao ? secaoMissao.nome : 'Sem seção') +
                      ' · ' +
                      (PRIORIDADES[missao.prioridade] || 'Média')}
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
