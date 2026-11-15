# kagebunshin-tabnews-ai
Implementation of 'https://tabnews.com.br' with AI agents

## Painel de TI do Kagebunshin

Painel de gestão de TI organizado por divisões e seções, construído com Next.js 16.2.12 (App Router), React 19, TypeScript e PostgreSQL.

### Perfis de acesso

- **Administrador**: único usuário com acesso total ao sistema, incluindo divisões, colunas do kanban, usuários e permissões.
- **Gestor**: responsável por uma divisão; cria, edita e exclui seções, missões, wiki e scripts da divisão e cadastra usuários para as suas seções.
- **Usuário**: pertence a uma seção; cadastra e edita missões, páginas da wiki e scripts da própria seção e atualiza o status das missões.

Contas criadas pelo cadastro público ou pelo primeiro login com Google ficam pendentes até um gestor ou o administrador atribuir divisão e seção.

### Funcionalidades

- **Página inicial** pública com apresentação da solução, login e cadastro (e-mail e senha ou conta Google).
- **Início**: indicadores, missões por coluna e prazos próximos ou atrasados.
- **Seções**: divisões e suas seções, com cor, responsável e contagem de itens.
- **Missões**: kanban com colunas configuráveis, arrastar e soltar e filtros por seção, prioridade e texto.
- **Wiki** com markdown simplificado e **Scripts** com cópia em um clique.
- **Usuários**: tabela com papel, divisão e seção de cada usuário.
- **Configurações** (tema e exportação dos dados visíveis) e **Perfil** (dados pessoais e senha).
- Tema claro/escuro e layout responsivo.

### Como executar

Pré-requisitos: Node.js 20.9+ e Docker.

1. Copie `.env.example` para `.env` e defina `ADMIN_PASSWORD` (mínimo de 8 caracteres) e, se for o caso, `APP_URL` com a URL pública da aplicação.
2. Instale as dependências, suba o banco e crie o schema, o administrador e os dados de exemplo:

```bash
npm install
npm run db:up
npm run db:setup
```

3. Inicie em desenvolvimento (`http://localhost:3000`) ou em produção:

```bash
npm run dev
```

```bash
npm run build && npm start
```

Verificação de tipos:

```bash
npm run typecheck
```

### Login com Google (opcional)

1. No Google Cloud Console, crie um ID do cliente OAuth do tipo "Aplicativo da Web".
2. Em "URIs de redirecionamento autorizados", adicione `<APP_URL>/api/auth/google/callback`.
3. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` e reinicie o servidor.

Sem essas variáveis, o botão "Entrar com Google" aparece desabilitado.
