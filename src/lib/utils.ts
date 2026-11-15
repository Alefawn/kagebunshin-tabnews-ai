export function uid(prefix?: string): string {
  return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!match) return '';
  return match[3] + '/' + match[2] + '/' + match[1];
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return now.getFullYear() + '-' + month + '-' + day;
}

export function initials(name: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function safeColor(value: string, fallback?: string): string {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback || '#2563eb';
}

export function mensagemErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) return erro.message;
  return 'Não foi possível concluir a operação.';
}
