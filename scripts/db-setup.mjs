import { readFile } from 'node:fs/promises';
import { randomBytes, scryptSync } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function falhar(mensagem) {
  console.error('Erro: ' + mensagem);
  process.exit(1);
}

function hashSenha(senha) {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return 'scrypt$' + salt.toString('base64') + '$' + hash.toString('base64');
}

function dayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) falhar('DATABASE_URL não definida. Copie .env.example para .env e rode de novo.');

const pool = new Pool({ connectionString: databaseUrl });

const COLUNAS = [
  { nome: 'A fazer', cor: '#64748b' },
  { nome: 'Em andamento', cor: '#2563eb' },
  { nome: 'Em revisão', cor: '#a855f7' },
  { nome: 'Concluído', cor: '#16a34a' }
];

const SECOES = [
  { chave: 'infra', nome: 'Infraestrutura', descricao: 'Servidores, virtualização, storage e rotinas de backup.', responsavel: 'Kagebunshin', cor: '#2563eb' },
  { chave: 'helpdesk', nome: 'Suporte / Helpdesk', descricao: 'Atendimento a usuários, chamados e manutenção de estações.', responsavel: 'Ana Ribeiro', cor: '#0ea5e9' },
  { chave: 'redes', nome: 'Redes', descricao: 'Switches, firewall, links de internet e VPN.', responsavel: 'Kagebunshin', cor: '#10b981' },
  { chave: 'seguranca', nome: 'Segurança', descricao: 'Políticas de acesso, antivírus, backup e conformidade.', responsavel: 'Marcos Lima', cor: '#f59e0b' }
];

const MISSOES = [
  { titulo: 'Migrar servidor de arquivos para SSD', descricao: 'Substituir os discos mecânicos do FS01 e validar desempenho do compartilhamento.', secao: 'infra', coluna: 'Em andamento', prioridade: 'alta', responsavel: 'Kagebunshin', prazo: dayOffset(3), ordem: 0 },
  { titulo: 'Renovar certificado do portal interno', descricao: 'Certificado vence em breve; renovar e reinstalar no IIS.', secao: 'seguranca', coluna: 'A fazer', prioridade: 'critica', responsavel: 'Marcos Lima', prazo: dayOffset(-2), ordem: 0 },
  { titulo: 'Configurar backup diário no NAS', descricao: 'Agendar rotina incremental às 23h e testar restauração de um arquivo.', secao: 'infra', coluna: 'Em revisão', prioridade: 'alta', responsavel: 'Kagebunshin', prazo: dayOffset(1), ordem: 0 },
  { titulo: 'Padronizar imagem do Windows 11', descricao: 'Criar imagem base com pacotes de escritório e agentes de segurança.', secao: 'helpdesk', coluna: 'A fazer', prioridade: 'media', responsavel: 'Ana Ribeiro', prazo: dayOffset(10), ordem: 1 },
  { titulo: 'Documentar VLANs do switch core', descricao: 'Registrar VLANs 10, 20, 30 e 40 no wiki de redes.', secao: 'redes', coluna: 'Concluído', prioridade: 'media', responsavel: 'Kagebunshin', prazo: dayOffset(-5), ordem: 0 },
  { titulo: 'Revisar regras do firewall', descricao: 'Remover regras obsoletas e liberar apenas portas necessárias.', secao: 'redes', coluna: 'Em andamento', prioridade: 'alta', responsavel: 'Kagebunshin', prazo: dayOffset(6), ordem: 1 }
];

const WIKI = [
  {
    titulo: 'Como restaurar backup do NAS',
    conteudo: '# Restauração de backup\n\nProcedimento para recuperar arquivos do NAS em caso de exclusão acidental.\n\n## Passos\n\n- Acessar o painel do NAS em `https://nas.local`\n- Abrir **Backup > Restauração**\n- Selecionar a data e a pasta desejada\n- Restaurar em uma pasta temporária antes de sobrescrever\n\n## Validação\n\n```bash\nls -lh /mnt/restore\n```\n\nSó liberar o acesso ao usuário após conferir os arquivos.',
    secao: 'infra'
  },
  {
    titulo: 'Procedimento de abertura de chamado',
    conteudo: '# Abertura de chamado\n\nTodo atendimento deve ser registrado no helpdesk.\n\n## Prioridades\n\n- **Crítica**: sistema parado ou incidente de segurança\n- **Alta**: usuário impedido de trabalhar\n- **Média**: lentidão ou dúvida operacional\n- **Baixa**: solicitação sem urgência\n\n## Checklist\n\n- Confirmar patrimônio da máquina\n- Descrever o erro e anexar print\n- Informar o horário do ocorrido',
    secao: 'helpdesk'
  }
];

const SCRIPTS = [
  {
    nome: 'backup-nas.sh',
    linguagem: 'Bash',
    descricao: 'Sincroniza a pasta de documentos com o NAS e registra o log da execução.',
    codigo: '#!/usr/bin/env bash\nset -euo pipefail\n\nORIGEM="/srv/dados"\nDESTINO="/mnt/nas/backup"\nLOG="/var/log/backup-nas.log"\n\nrsync -az --delete "$ORIGEM/" "$DESTINO/" >> "$LOG" 2>&1\necho "$(date -Iseconds) backup concluido" >> "$LOG"',
    secao: 'infra'
  },
  {
    nome: 'limpar-temp.ps1',
    linguagem: 'PowerShell',
    descricao: 'Remove arquivos temporários e a pasta de cache do navegador nas estações.',
    codigo: '$alvos = @(\n  "$env:TEMP\\*",\n  "$env:LOCALAPPDATA\\Microsoft\\Windows\\INetCache\\*"\n)\n\nforeach ($alvo in $alvos) {\n  Remove-Item -Path $alvo -Recurse -Force -ErrorAction SilentlyContinue\n}\n\nWrite-Host "Limpeza concluida"',
    secao: 'helpdesk'
  },
  {
    nome: 'inventario.py',
    linguagem: 'Python',
    descricao: 'Varre a faixa de rede e lista os hosts ativos para conferência de inventário.',
    codigo: 'import subprocess\n\nfaixa = "192.168.10."\nativos = []\n\nfor host in range(1, 255):\n    ip = f"{faixa}{host}"\n    resposta = subprocess.run(["ping", "-c", "1", "-W", "1", ip], capture_output=True)\n    if resposta.returncode == 0:\n        ativos.append(ip)\n\nprint("\\n".join(ativos))',
    secao: 'redes'
  }
];

async function criarAdmin(client) {
  const existente = await client.query("SELECT id FROM usuarios WHERE papel = 'admin' LIMIT 1");
  if (existente.rowCount > 0) return { criado: false, email: null };

  const nome = (process.env.ADMIN_NOME || '').trim() || 'Administrador';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD || '';

  if (!email) falhar('ADMIN_EMAIL não definido.');
  if (!senha) falhar('ADMIN_PASSWORD não definido. Defina uma senha com pelo menos 8 caracteres no .env.');
  if (senha.length < 8) falhar('ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.');

  await client.query(
    "INSERT INTO usuarios (nome, email, senha_hash, papel, ativo) VALUES ($1, $2, $3, 'admin', true)",
    [nome, email, hashSenha(senha)]
  );
  return { criado: true, email };
}

async function criarColunas(client) {
  const total = await client.query('SELECT count(*)::int AS total FROM colunas');
  if (total.rows[0].total > 0) return 0;
  for (let posicao = 0; posicao < COLUNAS.length; posicao += 1) {
    await client.query('INSERT INTO colunas (nome, cor, posicao) VALUES ($1, $2, $3)', [
      COLUNAS[posicao].nome,
      COLUNAS[posicao].cor,
      posicao
    ]);
  }
  return COLUNAS.length;
}

async function criarDivisaoExemplo(client) {
  const total = await client.query('SELECT count(*)::int AS total FROM divisoes');
  if (total.rows[0].total > 0) return false;

  const divisao = await client.query(
    'INSERT INTO divisoes (nome, descricao, cor) VALUES ($1, $2, $3) RETURNING id',
    ['Tecnologia da Informação', 'Infraestrutura, suporte, redes e segurança da informação.', '#2563eb']
  );
  const divisaoId = divisao.rows[0].id;

  const secoes = new Map();
  for (const secao of SECOES) {
    const criada = await client.query(
      'INSERT INTO secoes (divisao_id, nome, descricao, responsavel, cor) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [divisaoId, secao.nome, secao.descricao, secao.responsavel, secao.cor]
    );
    secoes.set(secao.chave, criada.rows[0].id);
  }

  const colunas = await client.query('SELECT id, nome FROM colunas');
  const colunasPorNome = new Map(colunas.rows.map((linha) => [linha.nome, linha.id]));

  for (const missao of MISSOES) {
    await client.query(
      'INSERT INTO missoes (divisao_id, secao_id, coluna_id, titulo, descricao, prioridade, responsavel, prazo, ordem) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        divisaoId,
        secoes.get(missao.secao),
        colunasPorNome.get(missao.coluna),
        missao.titulo,
        missao.descricao,
        missao.prioridade,
        missao.responsavel,
        missao.prazo,
        missao.ordem
      ]
    );
  }

  for (const pagina of WIKI) {
    await client.query('INSERT INTO wiki (divisao_id, secao_id, titulo, conteudo) VALUES ($1, $2, $3, $4)', [
      divisaoId,
      secoes.get(pagina.secao),
      pagina.titulo,
      pagina.conteudo
    ]);
  }

  for (const script of SCRIPTS) {
    await client.query(
      'INSERT INTO scripts (divisao_id, secao_id, nome, linguagem, descricao, codigo) VALUES ($1, $2, $3, $4, $5, $6)',
      [divisaoId, secoes.get(script.secao), script.nome, script.linguagem, script.descricao, script.codigo]
    );
  }

  return true;
}

async function resumo(client) {
  const contagens = await client.query(
    'SELECT (SELECT count(*)::int FROM divisoes) AS divisoes, (SELECT count(*)::int FROM secoes) AS secoes, (SELECT count(*)::int FROM colunas) AS colunas, (SELECT count(*)::int FROM usuarios) AS usuarios, (SELECT count(*)::int FROM missoes) AS missoes, (SELECT count(*)::int FROM wiki) AS wiki, (SELECT count(*)::int FROM scripts) AS scripts'
  );
  const admin = await client.query("SELECT email FROM usuarios WHERE papel = 'admin' LIMIT 1");
  return { ...contagens.rows[0], admin: admin.rows[0] ? admin.rows[0].email : '(nenhum)' };
}

async function main() {
  const schema = await readFile(path.join(raiz, 'db', 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query(schema);
    await client.query('BEGIN');
    const admin = await criarAdmin(client);
    const colunas = await criarColunas(client);
    const divisao = await criarDivisaoExemplo(client);
    await client.query('COMMIT');
    const totais = await resumo(client);
    console.log('Banco preparado.');
    console.log('Admin: ' + totais.admin + (admin.criado ? ' (criado agora)' : ' (já existia)'));
    console.log('Colunas criadas nesta execução: ' + colunas);
    console.log('Divisão de exemplo criada nesta execução: ' + (divisao ? 'sim' : 'não'));
    console.log(
      'Totais: ' +
        totais.divisoes +
        ' divisões, ' +
        totais.secoes +
        ' seções, ' +
        totais.colunas +
        ' colunas, ' +
        totais.usuarios +
        ' usuários, ' +
        totais.missoes +
        ' missões, ' +
        totais.wiki +
        ' páginas de wiki, ' +
        totais.scripts +
        ' scripts.'
    );
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((erro) => {
  console.error('Erro: ' + (erro && erro.message ? erro.message : String(erro)));
  process.exit(1);
});
