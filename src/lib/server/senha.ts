import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (senha: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(senha, salt, 64);
  return 'scrypt$' + salt.toString('base64') + '$' + hash.toString('base64');
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  const partes = String(hash || '').split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
  const salt = Buffer.from(partes[1], 'base64');
  const esperado = Buffer.from(partes[2], 'base64');
  if (!salt.length || !esperado.length) return false;
  const calculado = await scryptAsync(senha, salt, esperado.length);
  if (calculado.length !== esperado.length) return false;
  return timingSafeEqual(calculado, esperado);
}
