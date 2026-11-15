CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS divisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  cor text NOT NULL DEFAULT '#2563eb',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS secoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisao_id uuid NOT NULL REFERENCES divisoes(id) ON DELETE RESTRICT,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  responsavel text NOT NULL DEFAULT '',
  cor text NOT NULL DEFAULT '#2563eb',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS secoes_divisao ON secoes (divisao_id);

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  senha_hash text NULL,
  google_id text UNIQUE NULL,
  papel text NOT NULL CHECK (papel IN ('admin', 'gestor', 'usuario')),
  divisao_id uuid NULL REFERENCES divisoes(id) ON DELETE RESTRICT,
  secao_id uuid NULL REFERENCES secoes(id) ON DELETE SET NULL,
  cargo text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower ON usuarios (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_um_admin ON usuarios ((papel)) WHERE papel = 'admin';
CREATE INDEX IF NOT EXISTS usuarios_divisao ON usuarios (divisao_id);

CREATE TABLE IF NOT EXISTS sessoes (
  id text PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em timestamptz NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessoes_usuario ON sessoes (usuario_id);

CREATE TABLE IF NOT EXISTS colunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#64748b',
  posicao int NOT NULL
);

CREATE TABLE IF NOT EXISTS missoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisao_id uuid NOT NULL REFERENCES divisoes(id) ON DELETE RESTRICT,
  secao_id uuid NULL REFERENCES secoes(id) ON DELETE SET NULL,
  coluna_id uuid NOT NULL REFERENCES colunas(id) ON DELETE RESTRICT,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  prioridade text NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  responsavel text NOT NULL DEFAULT '',
  prazo date NULL,
  ordem int NOT NULL DEFAULT 0,
  criado_por uuid NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS missoes_divisao ON missoes (divisao_id);
CREATE INDEX IF NOT EXISTS missoes_coluna ON missoes (coluna_id, ordem);

CREATE TABLE IF NOT EXISTS wiki (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisao_id uuid NOT NULL REFERENCES divisoes(id) ON DELETE RESTRICT,
  secao_id uuid NULL REFERENCES secoes(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  criado_por uuid NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wiki_divisao ON wiki (divisao_id);

CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisao_id uuid NOT NULL REFERENCES divisoes(id) ON DELETE RESTRICT,
  secao_id uuid NULL REFERENCES secoes(id) ON DELETE SET NULL,
  nome text NOT NULL,
  linguagem text NOT NULL DEFAULT 'Outro',
  descricao text NOT NULL DEFAULT '',
  codigo text NOT NULL DEFAULT '',
  criado_por uuid NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scripts_divisao ON scripts (divisao_id);
