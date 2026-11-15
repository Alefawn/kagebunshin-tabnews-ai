'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { useUI } from '@/components/UIProvider';
import { PAPEIS } from '@/lib/store';
import { initials, mensagemErro } from '@/lib/utils';

export default function PerfilView() {
  const { dados, usuario, updatePerfil, alterarSenha } = useData();
  const { toast } = useUI();
  const [nome, setNome] = useState(usuario.nome);
  const [cargo, setCargo] = useState(usuario.cargo);
  const [telefone, setTelefone] = useState(usuario.telefone);
  const [bio, setBio] = useState(usuario.bio);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const divisao = dados.divisoes.find((item) => item.id === usuario.divisaoId);
  const secao = dados.secoes.find((item) => item.id === usuario.secaoId);

  const salvar = async () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome do perfil.', 'error');
      return;
    }
    setSalvando(true);
    try {
      await updatePerfil({
        nome: valorNome,
        cargo: cargo.trim(),
        telefone: telefone.trim(),
        bio: bio.trim()
      });
      toast('Perfil salvo.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvando(false);
    }
  };

  const salvarSenha = async () => {
    if (novaSenha.length < 8) {
      toast('A nova senha precisa ter pelo menos 8 caracteres.', 'error');
      return;
    }
    setSalvandoSenha(true);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      setSenhaAtual('');
      setNovaSenha('');
      toast(usuario.temSenha ? 'Senha alterada.' : 'Senha definida.');
    } catch (erro) {
      toast(mensagemErro(erro), 'error');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Perfil</h2>
          <p>Dados exibidos na barra lateral e nas saudações do painel.</p>
        </div>
      </div>
      <div className="profile-layout">
        <div className="card profile-preview">
          <span className="avatar avatar-lg" id="perfil-avatar">
            {initials(nome)}
          </span>
          <strong id="perfil-preview-nome">{nome || 'Sem nome'}</strong>
          <small id="perfil-preview-cargo">{cargo || 'Sem cargo'}</small>
          <span className="badge">{usuario.email}</span>
          <span className={'badge badge-' + usuario.papel}>{PAPEIS[usuario.papel]}</span>
          {usuario.temGoogle ? <span className="badge badge-accent">Conta Google vinculada</span> : null}
        </div>
        <div className="card profile-form">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="perfil-nome">Nome</label>
              <input
                className="input"
                id="perfil-nome"
                type="text"
                maxLength={60}
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="perfil-cargo">Cargo</label>
              <input
                className="input"
                id="perfil-cargo"
                type="text"
                maxLength={60}
                value={cargo}
                onChange={(event) => setCargo(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="perfil-email">E-mail</label>
              <input className="input" id="perfil-email" type="email" value={usuario.email} disabled readOnly />
            </div>
            <div className="field">
              <label htmlFor="perfil-telefone">Telefone</label>
              <input
                className="input"
                id="perfil-telefone"
                type="tel"
                maxLength={30}
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="perfil-papel">Papel</label>
              <input className="input" id="perfil-papel" type="text" value={PAPEIS[usuario.papel]} disabled readOnly />
            </div>
            <div className="field">
              <label htmlFor="perfil-divisao">Divisão</label>
              <input
                className="input"
                id="perfil-divisao"
                type="text"
                value={divisao ? divisao.nome : 'Sem divisão'}
                disabled
                readOnly
              />
            </div>
            <div className="field">
              <label htmlFor="perfil-secao">Seção</label>
              <input
                className="input"
                id="perfil-secao"
                type="text"
                value={secao ? secao.nome : 'Sem seção'}
                disabled
                readOnly
              />
            </div>
            <div className="field span-2">
              <label htmlFor="perfil-bio">Bio</label>
              <textarea
                className="textarea"
                id="perfil-bio"
                maxLength={240}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="button" onClick={salvar} disabled={salvando}>
              Salvar perfil
            </button>
          </div>
        </div>
        <div className="card settings-card">
          <h3>{usuario.temSenha ? 'Alterar senha' : 'Definir senha'}</h3>
          <p>
            {usuario.temSenha
              ? 'Informe a senha atual e a nova senha com pelo menos 8 caracteres.'
              : 'Sua conta ainda não tem senha. Defina uma com pelo menos 8 caracteres.'}
          </p>
          <div className="form-grid">
            {usuario.temSenha ? (
              <div className="field span-2">
                <label htmlFor="perfil-senha-atual">Senha atual</label>
                <input
                  className="input"
                  id="perfil-senha-atual"
                  type="password"
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                />
              </div>
            ) : null}
            <div className="field span-2">
              <label htmlFor="perfil-senha-nova">Nova senha</label>
              <input
                className="input"
                id="perfil-senha-nova"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" type="button" onClick={salvarSenha} disabled={salvandoSenha}>
              {usuario.temSenha ? 'Alterar senha' : 'Definir senha'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
