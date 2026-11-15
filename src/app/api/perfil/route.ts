import { query } from '@/lib/server/db';
import { erro, exigirUsuario, json, lerJson, verificarOrigem } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function PATCH(request: Request) {
  if (!verificarOrigem(request)) return erro('Origem não permitida.', 403);
  const usuario = await exigirUsuario();
  if (usuario instanceof Response) return usuario;

  const corpo = await lerJson(request);
  const nome = corpo.nome === undefined ? null : texto(corpo.nome);
  if (nome !== null && !nome) return erro('Informe o nome.', 400);

  await query(
    `UPDATE usuarios
        SET nome = COALESCE($2, nome),
            cargo = COALESCE($3, cargo),
            telefone = COALESCE($4, telefone),
            bio = COALESCE($5, bio)
      WHERE id = $1`,
    [
      usuario.id,
      nome,
      corpo.cargo === undefined ? null : texto(corpo.cargo),
      corpo.telefone === undefined ? null : texto(corpo.telefone),
      corpo.bio === undefined ? null : texto(corpo.bio)
    ]
  );

  return json({ ok: true });
}
