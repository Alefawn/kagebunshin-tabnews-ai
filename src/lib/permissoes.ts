import type { Papel, UsuarioSessao } from './types';

export interface AlvoItem {
  divisaoId: string;
  secaoId: string;
}

export interface AlvoUsuario {
  id: string;
  papel: Papel;
  divisaoId: string | null;
}

export function podeVerDivisao(usuario: UsuarioSessao, divisaoId: string): boolean {
  if (usuario.papel === 'admin') return true;
  return Boolean(usuario.divisaoId) && usuario.divisaoId === divisaoId;
}

export function podeGerenciarDivisoes(usuario: UsuarioSessao): boolean {
  return usuario.papel === 'admin';
}

export function podeGerenciarSecao(usuario: UsuarioSessao, divisaoId: string): boolean {
  if (usuario.papel === 'admin') return true;
  return usuario.papel === 'gestor' && Boolean(usuario.divisaoId) && usuario.divisaoId === divisaoId;
}

export function podeGerenciarColunas(usuario: UsuarioSessao): boolean {
  return usuario.papel === 'admin';
}

export function podeCriarItem(usuario: UsuarioSessao, alvo: AlvoItem): boolean {
  if (usuario.papel === 'admin') return true;
  if (!usuario.divisaoId || usuario.divisaoId !== alvo.divisaoId) return false;
  if (usuario.papel === 'gestor') return true;
  return Boolean(usuario.secaoId) && alvo.secaoId === usuario.secaoId;
}

export function podeEditarItem(usuario: UsuarioSessao, item: AlvoItem): boolean {
  if (usuario.papel === 'admin') return true;
  if (!usuario.divisaoId || usuario.divisaoId !== item.divisaoId) return false;
  if (usuario.papel === 'gestor') return true;
  return Boolean(usuario.secaoId) && item.secaoId === usuario.secaoId;
}

export function podeExcluirItem(usuario: UsuarioSessao, item: AlvoItem): boolean {
  if (usuario.papel === 'admin') return true;
  return usuario.papel === 'gestor' && Boolean(usuario.divisaoId) && usuario.divisaoId === item.divisaoId;
}

export function podeGerenciarUsuarios(usuario: UsuarioSessao): boolean {
  return usuario.papel === 'admin' || usuario.papel === 'gestor';
}

export function podeEditarUsuario(usuario: UsuarioSessao, alvo: AlvoUsuario): boolean {
  if (usuario.papel === 'admin') return true;
  if (usuario.papel !== 'gestor') return false;
  if (alvo.id === usuario.id) return false;
  if (alvo.papel !== 'usuario') return false;
  return alvo.divisaoId === null || alvo.divisaoId === usuario.divisaoId;
}

export function papeisAtribuiveis(usuario: UsuarioSessao): Papel[] {
  if (usuario.papel === 'admin') return ['gestor', 'usuario'];
  if (usuario.papel === 'gestor') return ['usuario'];
  return [];
}
