import { erro, json, verificarOrigem } from '@/lib/server/http';
import { encerrarSessao } from '@/lib/server/sessao';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  await encerrarSessao();
  return json({ ok: true });
}
