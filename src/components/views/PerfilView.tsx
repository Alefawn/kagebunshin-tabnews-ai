'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { useUI } from '@/components/UIProvider';
import type { Tema } from '@/lib/types';
import { initials } from '@/lib/utils';

const TEMAS: { valor: Tema; rotulo: string }[] = [
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
  { valor: 'system', rotulo: 'Sistema' }
];

export default function PerfilView() {
  const { data, updateProfile, setTheme } = useData();
  const { toast } = useUI();
  const perfil = data.profile;
  const [nome, setNome] = useState(perfil.nome);
  const [cargo, setCargo] = useState(perfil.cargo);
  const [email, setEmail] = useState(perfil.email);
  const [telefone, setTelefone] = useState(perfil.telefone);
  const [bio, setBio] = useState(perfil.bio);

  const salvar = () => {
    const valorNome = nome.trim();
    if (!valorNome) {
      toast('Informe o nome do perfil.', 'error');
      return;
    }
    updateProfile({
      nome: valorNome,
      cargo: cargo.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      bio: bio.trim()
    });
    toast('Perfil salvo.');
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
          <span className="badge">{email || 'Sem e-mail'}</span>
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
              <input
                className="input"
                id="perfil-email"
                type="email"
                maxLength={90}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
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
            <div className="field span-2">
              <label>Tema</label>
              <div className="segmented" id="perfil-tema" role="group" aria-label="Tema da interface">
                {TEMAS.map((item) => (
                  <button
                    type="button"
                    data-tema={item.valor}
                    className={data.theme === item.valor ? 'active' : ''}
                    key={item.valor}
                    onClick={() => {
                      setTheme(item.valor);
                      toast('Tema atualizado.');
                    }}
                  >
                    {item.rotulo}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="button" onClick={salvar}>
              Salvar perfil
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
