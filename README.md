# kagebunshin-tabnews-ai
Implementation of 'https://tabnews.com.br' with AI agents

## Painel de TI do Kagebunshin

Interface administrativa para o gestor de TI Kagebunshin organizar o dia a dia da área, construída com Next.js 16.2.12 (App Router), React 19 e TypeScript.

### Funcionalidades

- **Início**: saudação ao gestor, indicadores de seções, missões abertas e concluídas, wiki e scripts, gráfico por coluna do kanban e lista de prazos próximos ou atrasados.
- **Seções**: cadastro das áreas de TI com cor, responsável e contagem de itens vinculados; busca por nome e atalho para as missões da seção.
- **Missões**: kanban com colunas configuráveis (renomear, cor, reordenar, excluir), arrastar e soltar cartões, filtros por seção, prioridade e texto, além de edição completa em modal.
- **Wiki**: páginas com busca e filtro por seção, visualização com markdown simplificado (títulos, negrito, código, listas) e editor em modal.
- **Scripts**: biblioteca de automações com filtros por linguagem e seção, cópia do código com um clique e edição em modal.
- **Configurações**: tema claro, escuro ou sistema, exportação e importação de dados em JSON, restauração dos dados de exemplo e limpeza total.
- **Perfil**: nome, e-mail, cargo, telefone e bio, com avatar gerado pelas iniciais e atualização imediata da barra lateral.
- Tema claro/escuro, layout responsivo com menu lateral recolhível e persistência em `localStorage` na chave `kagebunshin:data:v1`.

### Como executar

Instale as dependências:

```bash
npm install
```

Ambiente de desenvolvimento em `http://localhost:3000`:

```bash
npm run dev
```

Build de produção e execução do servidor:

```bash
npm run build && npm start
```

Verificação de tipos:

```bash
npm run typecheck
```
