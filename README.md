# SkyPDV Frontend

Frontend completo do sistema SkyPDV (Ponto de Venda) desenvolvido com React, TypeScript e shadcn/ui.

## Funcionalidades Implementadas

### ✅ PDV (Ponto de Venda)
- Interface de vendas com grid de produtos
- Carrinho de compras com sidebar responsivo
- Seleção de quantidade de produtos
- Finalização de vendas com múltiplos métodos de pagamento
- Suporte a emoji nos produtos

### ✅ Produtos
- Listagem de produtos com busca e filtros
- Categorias dinâmicas
- Gestão de estoque
- Produtos locais, FastFood e SkyVenda

### ✅ Fornecedores
- Gestão de fornecedores locais
- Integração com FastFood (conectar restaurantes)
- Sincronização de produtos do FastFood
- Suporte a múltiplos tipos de fornecedores

### ✅ Caixa (Cash Register)
- Abertura e fechamento de caixa
- Controle de valores em dinheiro
- Resumo de vendas por método de pagamento

### ✅ Dashboard
- Visão geral com estatísticas do dia/semana/mês
- Vendas recentes
- Alertas de estoque baixo
- Top produtos

### ✅ Relatórios
- Relatórios de vendas
- Análise por período
- Produtos mais vendidos

### ✅ Configurações
- Configurações do terminal
- Métodos de pagamento
- Categorias
- Aparência e segurança

## Tecnologias

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **React Router** para navegação
- **TanStack Query** para gerenciamento de estado e cache
- **shadcn/ui** para componentes UI
- **Tailwind CSS** para estilização
- **Lucide React** e **Fluent UI Icons** para ícones

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── screens/        # Telas principais
│   ├── ui/             # Componentes UI (shadcn)
│   └── ...            # Componentes compartilhados
├── hooks/              # Custom hooks (React Query)
├── services/           # API services
│   ├── api.ts          # Endpoints SkyPDV
│   └── fastfoodApi.ts  # Endpoints FastFood
├── types/               # Tipos TypeScript
└── lib/                 # Utilitários
```

## Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Integração com API

O frontend está configurado para se conectar à API do SkyPDV. Configure a URL base da API em `src/services/api.ts`:

```typescript
const BASE_URL = "https://api.skyvenda.com";
```

## Funcionalidades da Documentação Implementadas

Todas as rotas principais da documentação `SKYPDV_API_DOCUMENTATION.md` foram implementadas:

- ✅ Terminal/Configurações
- ✅ Fornecedores (incluindo conexão FastFood)
- ✅ Produtos & Inventário
- ✅ Caixa (Cash Register)
- ✅ Vendas
- ✅ Dashboard & Relatórios
- ✅ Categorias
- ✅ Métodos de Pagamento
- ✅ Integração FastFood (restaurantes, menus, drinks)

## Próximos Passos

- [ ] Implementar impressão de recibos
- [ ] Adicionar relatórios detalhados com gráficos
- [ ] Implementar gestão completa de inventário
- [ ] Adicionar suporte offline
- [ ] Implementar autenticação e autorização

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
