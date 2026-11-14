import type {
  AppData,
  Coluna,
  Missao,
  Prioridade,
  Profile,
  Script,
  Secao,
  SecaoCounts,
  Tema,
  WikiPage
} from './types';
import { safeColor, uid } from './utils';

export const STORAGE_KEY = 'kagebunshin:data:v1';

export const PRIORIDADES: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica'
};

export const PRIORIDADE_VALORES: Prioridade[] = ['baixa', 'media', 'alta', 'critica'];

export const LINGUAGENS = ['Bash', 'PowerShell', 'Python', 'SQL', 'Batch', 'Outro'];

function nowIso(): string {
  return new Date().toISOString();
}

function dayOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

export function seed(): AppData {
  return {
    profile: {
      nome: 'Kagebunshin',
      email: 'kagebunshin@empresa.com.br',
      cargo: 'Gestor de TI',
      telefone: '(11) 98765-4321',
      bio: 'Responsável pela infraestrutura, suporte e segurança da informação.'
    },
    theme: 'system',
    secoes: [
      { id: 'sec-infra', nome: 'Infraestrutura', descricao: 'Servidores, virtualização, storage e rotinas de backup.', responsavel: 'Kagebunshin', cor: '#2563eb', criadoEm: nowIso() },
      { id: 'sec-helpdesk', nome: 'Suporte / Helpdesk', descricao: 'Atendimento a usuários, chamados e manutenção de estações.', responsavel: 'Ana Ribeiro', cor: '#0ea5e9', criadoEm: nowIso() },
      { id: 'sec-redes', nome: 'Redes', descricao: 'Switches, firewall, links de internet e VPN.', responsavel: 'Kagebunshin', cor: '#10b981', criadoEm: nowIso() },
      { id: 'sec-seguranca', nome: 'Segurança', descricao: 'Políticas de acesso, antivírus, backup e conformidade.', responsavel: 'Marcos Lima', cor: '#f59e0b', criadoEm: nowIso() }
    ],
    colunas: [
      { id: 'col-todo', nome: 'A fazer', cor: '#64748b' },
      { id: 'col-doing', nome: 'Em andamento', cor: '#2563eb' },
      { id: 'col-review', nome: 'Em revisão', cor: '#a855f7' },
      { id: 'col-done', nome: 'Concluído', cor: '#16a34a' }
    ],
    missoes: [
      { id: 'mis-1', titulo: 'Migrar servidor de arquivos para SSD', descricao: 'Substituir os discos mecânicos do FS01 e validar desempenho do compartilhamento.', secaoId: 'sec-infra', colunaId: 'col-doing', prioridade: 'alta', responsavel: 'Kagebunshin', prazo: dayOffset(3), ordem: 0, criadoEm: nowIso() },
      { id: 'mis-2', titulo: 'Renovar certificado do portal interno', descricao: 'Certificado vence em breve; renovar e reinstalar no IIS.', secaoId: 'sec-seguranca', colunaId: 'col-todo', prioridade: 'critica', responsavel: 'Marcos Lima', prazo: dayOffset(-2), ordem: 0, criadoEm: nowIso() },
      { id: 'mis-3', titulo: 'Configurar backup diário no NAS', descricao: 'Agendar rotina incremental às 23h e testar restauração de um arquivo.', secaoId: 'sec-infra', colunaId: 'col-review', prioridade: 'alta', responsavel: 'Kagebunshin', prazo: dayOffset(1), ordem: 0, criadoEm: nowIso() },
      { id: 'mis-4', titulo: 'Padronizar imagem do Windows 11', descricao: 'Criar imagem base com pacotes de escritório e agentes de segurança.', secaoId: 'sec-helpdesk', colunaId: 'col-todo', prioridade: 'media', responsavel: 'Ana Ribeiro', prazo: dayOffset(10), ordem: 1, criadoEm: nowIso() },
      { id: 'mis-5', titulo: 'Documentar VLANs do switch core', descricao: 'Registrar VLANs 10, 20, 30 e 40 no wiki de redes.', secaoId: 'sec-redes', colunaId: 'col-done', prioridade: 'media', responsavel: 'Kagebunshin', prazo: dayOffset(-5), ordem: 0, criadoEm: nowIso() },
      { id: 'mis-6', titulo: 'Revisar regras do firewall', descricao: 'Remover regras obsoletas e liberar apenas portas necessárias.', secaoId: 'sec-redes', colunaId: 'col-doing', prioridade: 'alta', responsavel: 'Kagebunshin', prazo: dayOffset(6), ordem: 1, criadoEm: nowIso() }
    ],
    wiki: [
      {
        id: 'wiki-1',
        titulo: 'Como restaurar backup do NAS',
        conteudo: '# Restauração de backup\n\nProcedimento para recuperar arquivos do NAS em caso de exclusão acidental.\n\n## Passos\n\n- Acessar o painel do NAS em `https://nas.local`\n- Abrir **Backup > Restauração**\n- Selecionar a data e a pasta desejada\n- Restaurar em uma pasta temporária antes de sobrescrever\n\n## Validação\n\n```bash\nls -lh /mnt/restore\n```\n\nSó liberar o acesso ao usuário após conferir os arquivos.',
        secaoId: 'sec-infra',
        atualizadoEm: nowIso()
      },
      {
        id: 'wiki-2',
        titulo: 'Procedimento de abertura de chamado',
        conteudo: '# Abertura de chamado\n\nTodo atendimento deve ser registrado no helpdesk.\n\n## Prioridades\n\n- **Crítica**: sistema parado ou incidente de segurança\n- **Alta**: usuário impedido de trabalhar\n- **Média**: lentidão ou dúvida operacional\n- **Baixa**: solicitação sem urgência\n\n## Checklist\n\n- Confirmar patrimônio da máquina\n- Descrever o erro e anexar print\n- Informar o horário do ocorrido',
        secaoId: 'sec-helpdesk',
        atualizadoEm: nowIso()
      }
    ],
    scripts: [
      {
        id: 'scr-1',
        nome: 'backup-nas.sh',
        linguagem: 'Bash',
        descricao: 'Sincroniza a pasta de documentos com o NAS e registra o log da execução.',
        codigo: '#!/usr/bin/env bash\nset -euo pipefail\n\nORIGEM="/srv/dados"\nDESTINO="/mnt/nas/backup"\nLOG="/var/log/backup-nas.log"\n\nrsync -az --delete "$ORIGEM/" "$DESTINO/" >> "$LOG" 2>&1\necho "$(date -Iseconds) backup concluido" >> "$LOG"',
        secaoId: 'sec-infra',
        atualizadoEm: nowIso()
      },
      {
        id: 'scr-2',
        nome: 'limpar-temp.ps1',
        linguagem: 'PowerShell',
        descricao: 'Remove arquivos temporários e a pasta de cache do navegador nas estações.',
        codigo: '$alvos = @(\n  "$env:TEMP\\*",\n  "$env:LOCALAPPDATA\\Microsoft\\Windows\\INetCache\\*"\n)\n\nforeach ($alvo in $alvos) {\n  Remove-Item -Path $alvo -Recurse -Force -ErrorAction SilentlyContinue\n}\n\nWrite-Host "Limpeza concluida"',
        secaoId: 'sec-helpdesk',
        atualizadoEm: nowIso()
      },
      {
        id: 'scr-3',
        nome: 'inventario.py',
        linguagem: 'Python',
        descricao: 'Varre a faixa de rede e lista os hosts ativos para conferência de inventário.',
        codigo: 'import subprocess\n\nfaixa = "192.168.10."\nativos = []\n\nfor host in range(1, 255):\n    ip = f"{faixa}{host}"\n    resposta = subprocess.run(["ping", "-c", "1", "-W", "1", ip], capture_output=True)\n    if resposta.returncode == 0:\n        ativos.append(ip)\n\nprint("\\n".join(ativos))',
        secaoId: 'sec-redes',
        atualizadoEm: nowIso()
      }
    ]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalize(data: unknown): AppData {
  const base = seed();
  const source = isRecord(data) ? data : {};
  const profile = isRecord(source.profile) ? source.profile : {};
  const theme = source.theme;
  return {
    profile: {
      nome: typeof profile.nome === 'string' ? profile.nome : base.profile.nome,
      email: typeof profile.email === 'string' ? profile.email : base.profile.email,
      cargo: typeof profile.cargo === 'string' ? profile.cargo : base.profile.cargo,
      telefone: typeof profile.telefone === 'string' ? profile.telefone : base.profile.telefone,
      bio: typeof profile.bio === 'string' ? profile.bio : base.profile.bio
    },
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    secoes: Array.isArray(source.secoes) ? (source.secoes as Secao[]) : [],
    colunas: Array.isArray(source.colunas) && source.colunas.length ? (source.colunas as Coluna[]) : base.colunas,
    missoes: Array.isArray(source.missoes) ? (source.missoes as Missao[]) : [],
    wiki: Array.isArray(source.wiki) ? (source.wiki as WikiPage[]) : [],
    scripts: Array.isArray(source.scripts) ? (source.scripts as Script[]) : []
  };
}

export function validateImport(data: unknown): boolean {
  if (!isRecord(data)) return false;
  return ['secoes', 'colunas', 'missoes', 'wiki', 'scripts'].every((chave) => Array.isArray(data[chave]));
}

export function load(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    return seed();
  }
  return seed();
}

export function persist(data: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    return false;
  }
  return true;
}

export function byOrdem(a: Missao, b: Missao): number {
  return (a.ordem || 0) - (b.ordem || 0);
}

export function lastColumnId(data: AppData): string {
  return data.colunas.length ? data.colunas[data.colunas.length - 1].id : '';
}

export function secaoNome(data: AppData, id: string): string {
  const secao = data.secoes.find((item) => item.id === id);
  return secao ? secao.nome : '';
}

export function countsSecao(data: AppData, id: string): SecaoCounts {
  return {
    missoes: data.missoes.filter((item) => item.secaoId === id).length,
    wiki: data.wiki.filter((item) => item.secaoId === id).length,
    scripts: data.scripts.filter((item) => item.secaoId === id).length
  };
}

export interface SecaoInput {
  nome: string;
  descricao?: string;
  responsavel?: string;
  cor?: string;
}

export function addSecao(data: AppData, input: SecaoInput): { data: AppData; item: Secao } {
  const item: Secao = {
    id: uid('sec'),
    nome: input.nome,
    descricao: input.descricao || '',
    responsavel: input.responsavel || '',
    cor: safeColor(input.cor || ''),
    criadoEm: nowIso()
  };
  return { data: { ...data, secoes: [...data.secoes, item] }, item };
}

export function updateSecao(data: AppData, id: string, patch: Partial<SecaoInput>): AppData {
  return {
    ...data,
    secoes: data.secoes.map((secao) => {
      if (secao.id !== id) return secao;
      return {
        ...secao,
        nome: patch.nome !== undefined ? patch.nome : secao.nome,
        descricao: patch.descricao !== undefined ? patch.descricao : secao.descricao,
        responsavel: patch.responsavel !== undefined ? patch.responsavel : secao.responsavel,
        cor: patch.cor !== undefined ? safeColor(patch.cor, secao.cor) : secao.cor
      };
    })
  };
}

export function removeSecao(data: AppData, id: string): AppData {
  return {
    ...data,
    secoes: data.secoes.filter((secao) => secao.id !== id),
    missoes: data.missoes.map((missao) => (missao.secaoId === id ? { ...missao, secaoId: '' } : missao)),
    wiki: data.wiki.map((pagina) => (pagina.secaoId === id ? { ...pagina, secaoId: '' } : pagina)),
    scripts: data.scripts.map((script) => (script.secaoId === id ? { ...script, secaoId: '' } : script))
  };
}

export function addColuna(data: AppData, nome: string, cor: string): { data: AppData; item: Coluna } {
  const item: Coluna = { id: uid('col'), nome, cor: safeColor(cor, '#64748b') };
  return { data: { ...data, colunas: [...data.colunas, item] }, item };
}

export function updateColuna(data: AppData, id: string, patch: { nome?: string; cor?: string }): AppData {
  return {
    ...data,
    colunas: data.colunas.map((coluna) => {
      if (coluna.id !== id) return coluna;
      return {
        ...coluna,
        nome: patch.nome !== undefined ? patch.nome : coluna.nome,
        cor: patch.cor !== undefined ? safeColor(patch.cor, coluna.cor) : coluna.cor
      };
    })
  };
}

export function moveColuna(data: AppData, id: string, direction: number): AppData {
  const index = data.colunas.findIndex((coluna) => coluna.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= data.colunas.length) return data;
  const colunas = [...data.colunas];
  const moved = colunas.splice(index, 1)[0];
  colunas.splice(target, 0, moved);
  return { ...data, colunas };
}

export function removeColuna(data: AppData, id: string): { data: AppData; ok: boolean; total: number } {
  const total = data.missoes.filter((missao) => missao.colunaId === id).length;
  if (total > 0) return { data, ok: false, total };
  return { data: { ...data, colunas: data.colunas.filter((coluna) => coluna.id !== id) }, ok: true, total: 0 };
}

function nextOrdem(data: AppData, colunaId: string): number {
  const ordens = data.missoes
    .filter((missao) => missao.colunaId === colunaId)
    .map((missao) => missao.ordem || 0);
  return ordens.length ? Math.max(...ordens) + 1 : 0;
}

export interface MissaoInput {
  titulo: string;
  descricao?: string;
  secaoId?: string;
  colunaId: string;
  prioridade?: Prioridade;
  responsavel?: string;
  prazo?: string;
}

export function addMissao(data: AppData, input: MissaoInput): { data: AppData; item: Missao } {
  const item: Missao = {
    id: uid('mis'),
    titulo: input.titulo,
    descricao: input.descricao || '',
    secaoId: input.secaoId || '',
    colunaId: input.colunaId,
    prioridade: input.prioridade || 'media',
    responsavel: input.responsavel || '',
    prazo: input.prazo || '',
    ordem: nextOrdem(data, input.colunaId),
    criadoEm: nowIso()
  };
  return { data: { ...data, missoes: [...data.missoes, item] }, item };
}

export function updateMissao(data: AppData, id: string, patch: Partial<MissaoInput>): AppData {
  return {
    ...data,
    missoes: data.missoes.map((missao) => {
      if (missao.id !== id) return missao;
      const atualizada: Missao = {
        ...missao,
        titulo: patch.titulo !== undefined ? patch.titulo : missao.titulo,
        descricao: patch.descricao !== undefined ? patch.descricao : missao.descricao,
        secaoId: patch.secaoId !== undefined ? patch.secaoId : missao.secaoId,
        prioridade: patch.prioridade !== undefined ? patch.prioridade : missao.prioridade,
        responsavel: patch.responsavel !== undefined ? patch.responsavel : missao.responsavel,
        prazo: patch.prazo !== undefined ? patch.prazo : missao.prazo
      };
      if (patch.colunaId !== undefined && patch.colunaId !== missao.colunaId) {
        atualizada.colunaId = patch.colunaId;
        atualizada.ordem = nextOrdem(data, patch.colunaId);
      }
      return atualizada;
    })
  };
}

export function removeMissao(data: AppData, id: string): AppData {
  return { ...data, missoes: data.missoes.filter((missao) => missao.id !== id) };
}

export function moveMissao(data: AppData, id: string, colunaId: string, index: number): AppData {
  const missao = data.missoes.find((item) => item.id === id);
  if (!missao) return data;
  const lista = data.missoes
    .filter((item) => item.colunaId === colunaId && item.id !== id)
    .sort(byOrdem);
  const posicao = Math.max(0, Math.min(index, lista.length));
  const movida: Missao = { ...missao, colunaId };
  lista.splice(posicao, 0, movida);
  const ordens = new Map<string, number>();
  lista.forEach((item, pos) => ordens.set(item.id, pos));
  return {
    ...data,
    missoes: data.missoes.map((item) => {
      const ordem = ordens.get(item.id);
      if (ordem === undefined) return item;
      return { ...item, colunaId, ordem };
    })
  };
}

export interface WikiInput {
  titulo: string;
  conteudo?: string;
  secaoId?: string;
}

export function addWiki(data: AppData, input: WikiInput): { data: AppData; item: WikiPage } {
  const item: WikiPage = {
    id: uid('wiki'),
    titulo: input.titulo,
    conteudo: input.conteudo || '',
    secaoId: input.secaoId || '',
    atualizadoEm: nowIso()
  };
  return { data: { ...data, wiki: [...data.wiki, item] }, item };
}

export function updateWiki(data: AppData, id: string, patch: Partial<WikiInput>): AppData {
  return {
    ...data,
    wiki: data.wiki.map((pagina) => {
      if (pagina.id !== id) return pagina;
      return {
        ...pagina,
        titulo: patch.titulo !== undefined ? patch.titulo : pagina.titulo,
        conteudo: patch.conteudo !== undefined ? patch.conteudo : pagina.conteudo,
        secaoId: patch.secaoId !== undefined ? patch.secaoId : pagina.secaoId,
        atualizadoEm: nowIso()
      };
    })
  };
}

export function removeWiki(data: AppData, id: string): AppData {
  return { ...data, wiki: data.wiki.filter((pagina) => pagina.id !== id) };
}

export interface ScriptInput {
  nome: string;
  linguagem?: string;
  descricao?: string;
  codigo?: string;
  secaoId?: string;
}

export function addScript(data: AppData, input: ScriptInput): { data: AppData; item: Script } {
  const item: Script = {
    id: uid('scr'),
    nome: input.nome,
    linguagem: input.linguagem || 'Outro',
    descricao: input.descricao || '',
    codigo: input.codigo || '',
    secaoId: input.secaoId || '',
    atualizadoEm: nowIso()
  };
  return { data: { ...data, scripts: [...data.scripts, item] }, item };
}

export function updateScript(data: AppData, id: string, patch: Partial<ScriptInput>): AppData {
  return {
    ...data,
    scripts: data.scripts.map((script) => {
      if (script.id !== id) return script;
      return {
        ...script,
        nome: patch.nome !== undefined ? patch.nome : script.nome,
        linguagem: patch.linguagem !== undefined ? patch.linguagem : script.linguagem,
        descricao: patch.descricao !== undefined ? patch.descricao : script.descricao,
        codigo: patch.codigo !== undefined ? patch.codigo : script.codigo,
        secaoId: patch.secaoId !== undefined ? patch.secaoId : script.secaoId,
        atualizadoEm: nowIso()
      };
    })
  };
}

export function removeScript(data: AppData, id: string): AppData {
  return { ...data, scripts: data.scripts.filter((script) => script.id !== id) };
}

export function updateProfile(data: AppData, patch: Partial<Profile>): AppData {
  return {
    ...data,
    profile: {
      nome: patch.nome !== undefined ? patch.nome : data.profile.nome,
      email: patch.email !== undefined ? patch.email : data.profile.email,
      cargo: patch.cargo !== undefined ? patch.cargo : data.profile.cargo,
      telefone: patch.telefone !== undefined ? patch.telefone : data.profile.telefone,
      bio: patch.bio !== undefined ? patch.bio : data.profile.bio
    }
  };
}

export function setTheme(data: AppData, theme: Tema): AppData {
  return { ...data, theme: theme === 'light' || theme === 'dark' ? theme : 'system' };
}

export function clearAll(data: AppData): AppData {
  return { ...data, secoes: [], missoes: [], wiki: [], scripts: [] };
}

export function importData(data: unknown): AppData {
  return normalize(data);
}
