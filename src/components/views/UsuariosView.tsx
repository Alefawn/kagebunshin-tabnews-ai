'use client';

import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/components/DataProvider';
import { Modal, useUI } from '@/components/UIProvider';
import { papeisAtribuiveis, podeEditarUsuario, podeGerenciarUsuarios } from '@/lib/permissoes';
import { PAPEIS } from '@/lib/store';
import type { Papel, Usuario } from '@/lib/types';
import { mensagemErro } from '@/lib/utils';

function UsuarioFormModal({
  alvo,
  onClose,
  onSalvo
}: {
  alvo?: Usuario | null;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const { dados, usuario, criarUsuario, atualizarUsuario } = useData();
  const { toast } = useUI();
  const edicao = Boolean(alvo);
  const papeis = papeisAtribuiveis(usuario);
  const divisoes = usuario.papel === 'admin' ? dados.divisoes : dados.divisoes.filter((item) => item.id === usuario.divisaoId);
  const secoes = usuario.papel === 'admin' ? dados.secoes : dados.secoes.filter((item) => item.divisaoId === usuario.divisaoId);

  const [nome, setNome] = useState(alvo ? alvo.nome : '');
  const [email, setEmail] = useState(alvo ? alvo.email : '');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<Papel>(alvo ? alvo.papel : papeis[0] || 'usuario');
  const [divisaoId, setDivisaoId] = useState(
    alvo ? alvo.divisaoId || '' : usuario.divisaoId || (divisoes[0] ? divisoes[0].id : '')
  );
  const [secaoId, setSecaoId] = useState(alvo ? alvo.secaoId || '' : '');
  const [cargo, setCargo] = useState(alvo ? alvo.cargo : '');
  const [ativo, setAtivo] = useState(alvo ? alvo.ativo : true);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const valorNome = nome.trim();
    const valorEmail = email.trim();
    if (!valorNome) {
      toast('Informe o nome.', 'error');
      return;
    }
    if (!valorEmail) {
      toast('Informe o e-mail.', 'error');
      return;
    }
    if (!edicao && senha.length < 8) {
      toast('A senha precisa ter pelo menos 8 caracteres.', 'error');
      return;
    }
    if (senha && senha.length < 8) {
      toast('A senha precisa ter pelo menos 8 caracteres.', 'error');
      return;
    }
    if (papel === 'usuario' && !secaoId) {
      toast('Informe a seção do usuário.', 'error');
      return;
    }
    if (papel === 'gestor' && !divisaoId) {
      toast('Informe a divisão do gestor.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dadosUsuario = {
        nome: valorNome,
        email: valorEmail,
        senha: senha || undefined,
        papel,
        divisaoId: papel === 'gestor' ? divisaoId : undefined,
        secaoId: papel === 'usuario' ? secaoId : undefined,
        cargo: cargo.trim(),
        ativo
      };
      if (alvo) {
        await atualizarUsuario(alvo.id, dadosUsuario);
        toast('Usuário atualizado.');
      } else {
        await criarUsuario(dadosUsuario);
        toast('Usuário criado.');
      }
      onSalvo();
      onClose();
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      title={edicao ? 'Editar usuário' : 'Novo usuário'}
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
          <label htmlFor="usuario-nome">Nome *</label>
          <input
            className="input"
            id="usuario-nome"
            type="text"
            maxLength={60}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="usuario-email">E-mail *</label>
          <input
            className="input"
            id="usuario-email"
            type="email"
            maxLength={90}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="usuario-senha">{edicao ? 'Nova senha' : 'Senha *'}</label>
          <input
            className="input"
            id="usuario-senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder={edicao ? 'Deixe em branco para manter' : 'Mínimo de 8 caracteres'}
          />
        </div>
        <div className="field">
          <label htmlFor="usuario-papel">Papel *</label>
          <select
            className="select"
            id="usuario-papel"
            value={papel}
            onChange={(event) => setPapel(event.target.value as Papel)}
          >
            {papeis.map((valor) => (
              <option value={valor} key={valor}>
                {PAPEIS[valor]}
              </option>
            ))}
          </select>
        </div>
        {papel === 'gestor' ? (
          <div className="field">
            <label htmlFor="usuario-divisao">Divisão *</label>
            <select
              className="select"
              id="usuario-divisao"
              value={divisaoId}
              onChange={(event) => setDivisaoId(event.target.value)}
            >
              <option value="">Selecione</option>
              {divisoes.map((divisao) => (
                <option value={divisao.id} key={divisao.id}>
                  {divisao.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {papel === 'usuario' ? (
          <div className="field">
            <label htmlFor="usuario-secao">Seção *</label>
            <select
              className="select"
              id="usuario-secao"
              value={secaoId}
              onChange={(event) => setSecaoId(event.target.value)}
            >
              <option value="">Selecione</option>
              {usuario.papel === 'admin'
                ? dados.divisoes.map((divisao) => (
                    <optgroup label={divisao.nome} key={divisao.id}>
                      {secoes
                        .filter((secao) => secao.divisaoId === divisao.id)
                        .map((secao) => (
                          <option value={secao.id} key={secao.id}>
                            {secao.nome}
                          </option>
                        ))}
                    </optgroup>
                  ))
                : secoes.map((secao) => (
                    <option value={secao.id} key={secao.id}>
                      {secao.nome}
                    </option>
                  ))}
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="usuario-cargo">Cargo</label>
          <input
            className="input"
            id="usuario-cargo"
            type="text"
            maxLength={60}
            value={cargo}
            onChange={(event) => setCargo(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="usuario-ativo">Status</label>
          <label className="check" htmlFor="usuario-ativo">
            <input
              id="usuario-ativo"
              type="checkbox"
              checked={ativo}
              onChange={(event) => setAtivo(event.target.checked)}
            />
            Usuário ativo
          </label>
        </div>
      </div>
    </Modal>
  );
}

export default function UsuariosView() {
  const { dados, usuario, listarUsuarios, removerUsuario } = useData();
  const { toast, confirm } = useUI();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState('');
  const [filtroDivisao, setFiltroDivisao] = useState('');
  const [somentePendentes, setSomentePendentes] = useState(false);
  const [formulario, setFormulario] = useState<{ alvo: Usuario | null } | null>(null);
  const permitido = podeGerenciarUsuarios(usuario);

  const carregar = useCallback(async () => {
    try {
      const lista = await listarUsuarios();
      setUsuarios(lista);
      setErro('');
    } catch (falha) {
      setErro(mensagemErro(falha));
    }
  }, [listarUsuarios]);

  useEffect(() => {
    if (!permitido) return;
    carregar();
  }, [carregar, permitido]);

  if (!permitido) {
    return <p className="empty">Acesso restrito.</p>;
  }

  const termo = busca.trim().toLowerCase();
  const lista = (usuarios || []).filter((item) => {
    if (termo && (item.nome + ' ' + item.email).toLowerCase().indexOf(termo) === -1) return false;
    if (filtroPapel && item.papel !== filtroPapel) return false;
    if (filtroDivisao && item.divisaoId !== filtroDivisao) return false;
    if (somentePendentes && (item.divisaoId || item.papel === 'admin')) return false;
    return true;
  });

  const excluir = async (item: Usuario) => {
    const ok = await confirm({
      title: 'Excluir usuário',
      message: 'Excluir o usuário "' + item.nome + '"?',
      confirmLabel: 'Excluir',
      danger: true
    });
    if (!ok) return;
    try {
      await removerUsuario(item.id);
      toast('Usuário excluído.');
      await carregar();
    } catch (falha) {
      toast(mensagemErro(falha), 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Usuários</h2>
          <p>Pessoas com acesso ao painel, seus papéis e suas seções.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" type="button" onClick={() => setFormulario({ alvo: null })}>
            Novo usuário
          </button>
        </div>
      </div>
      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="usuarios-busca">Buscar</label>
          <input
            className="input"
            id="usuarios-busca"
            type="search"
            placeholder="Nome ou e-mail"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="usuarios-papel">Papel</label>
          <select
            className="select"
            id="usuarios-papel"
            value={filtroPapel}
            onChange={(event) => setFiltroPapel(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="admin">Administrador</option>
            <option value="gestor">Gestor</option>
            <option value="usuario">Usuário</option>
          </select>
        </div>
        {usuario.papel === 'admin' ? (
          <div className="field">
            <label htmlFor="usuarios-divisao">Divisão</label>
            <select
              className="select"
              id="usuarios-divisao"
              value={filtroDivisao}
              onChange={(event) => setFiltroDivisao(event.target.value)}
            >
              <option value="">Todas</option>
              {dados.divisoes.map((divisao) => (
                <option value={divisao.id} key={divisao.id}>
                  {divisao.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="usuarios-pendentes">Pendentes</label>
          <label className="check" htmlFor="usuarios-pendentes">
            <input
              id="usuarios-pendentes"
              type="checkbox"
              checked={somentePendentes}
              onChange={(event) => setSomentePendentes(event.target.checked)}
            />
            Somente pendentes
          </label>
        </div>
      </div>
      {erro ? <p className="empty">{erro}</p> : null}
      <div className="table-wrap">
        <table className="table" id="usuarios-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Divisão</th>
              <th>Seção</th>
              <th>Status</th>
              <th className="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.length ? (
              lista.map((item) => {
                const divisao = dados.divisoes.find((valor) => valor.id === item.divisaoId);
                const secao = dados.secoes.find((valor) => valor.id === item.secaoId);
                const pendente = !item.divisaoId && item.papel !== 'admin';
                const editavel = podeEditarUsuario(usuario, {
                  id: item.id,
                  papel: item.papel,
                  divisaoId: item.divisaoId
                });
                return (
                  <tr data-id={item.id} key={item.id}>
                    <td>
                      <strong>{item.nome}</strong>
                    </td>
                    <td>{item.email}</td>
                    <td>
                      <span className={'badge badge-' + item.papel}>{PAPEIS[item.papel]}</span>
                    </td>
                    <td>{divisao ? divisao.nome : pendente ? <span className="badge badge-danger">Pendente</span> : '—'}</td>
                    <td>{secao ? secao.nome : '—'}</td>
                    <td>
                      <span className={'badge ' + (item.ativo ? 'badge-success' : 'badge-danger')}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="col-acoes">
                      {item.papel === 'admin' ? (
                        <span className="small muted">Administrador do sistema</span>
                      ) : editavel ? (
                        <span className="acoes">
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => setFormulario({ alvo: item })}
                            aria-label={'Editar usuário ' + item.nome}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                              <path d="m14 6 4 4" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn btn-icon-danger"
                            type="button"
                            onClick={() => excluir(item)}
                            aria-label={'Excluir usuário ' + item.nome}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 7h16" />
                              <path d="M9 7V4h6v3" />
                              <path d="M6 7l1 13h10l1-13" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </span>
                      ) : (
                        <span className="small muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <p className="empty">Nenhum usuário encontrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {formulario ? (
        <UsuarioFormModal
          alvo={formulario.alvo}
          onClose={() => setFormulario(null)}
          onSalvo={carregar}
        />
      ) : null}
    </>
  );
}
