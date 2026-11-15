import { erro, json } from '@/lib/server/http';
import { usuarioAtual } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

export async function GET() {
  const usuario = await usuarioAtual();
  if (!usuario) return erro('Sessão expirada. Entre novamente.', 401);
  return json(usuario);
}
