# SkyPDV API - Documentação Completa

Esta documentação descreve todas as rotas da API do SkyPDV e as rotas do FastFood necessárias para o frontend.

**Base URL:** `/skypdv`  
**Autenticação:** Todas as rotas requerem autenticação via Bearer Token (exceto quando indicado)

---

## Índice

1. [Terminal](#terminal)
2. [Fornecedores (Suppliers)](#fornecedores-suppliers)
3. [Produtos e Inventário](#produtos-e-inventário)
4. [Caixa (Cash Register)](#caixa-cash-register)
5. [Vendas (Sales)](#vendas-sales)
6. [Dashboard e Relatórios](#dashboard-e-relatórios)
7. [Categorias](#categorias)
8. [Métodos de Pagamento](#métodos-de-pagamento)
9. [Rotas FastFood Necessárias](#rotas-fastfood-necessárias)

---

## Terminal

### GET `/skypdv/terminal`
Obter ou criar o terminal PDV do usuário atual.

**Resposta:**
```json
{
  "id": 1,
  "user_id": 123,
  "name": "Loja de João",
  "description": null,
  "logo": null,
  "address": null,
  "phone": null,
  "tax_rate": "0.00",
  "currency": "MZN",
  "settings": null,
  "active": true,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T10:00:00"
}
```

### PUT `/skypdv/terminal`
Atualizar configurações do terminal.

**Body:**
```json
{
  "name": "Nova Loja",
  "description": "Descrição da loja",
  "logo": "url_do_logo",
  "address": "Endereço completo",
  "phone": "841234567",
  "tax_rate": "0.16",
  "currency": "MZN",
  "settings": {},
  "active": true
}
```

---

## Fornecedores (Suppliers)

### GET `/skypdv/suppliers`
Listar todos os fornecedores conectados ao terminal.

**Resposta:**
```json
[
  {
    "id": 1,
    "terminal_id": 1,
    "name": "Produtos Locais",
    "source_type": "local",
    "external_id": null,
    "contact_name": null,
    "contact_phone": null,
    "contact_email": null,
    "address": null,
    "notes": null,
    "is_active": true,
    "last_sync_at": null,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### POST `/skypdv/suppliers`
Adicionar novo fornecedor manual.

**Body:**
```json
{
  "name": "Fornecedor ABC",
  "source_type": "local",
  "external_id": null,
  "contact_name": "João Silva",
  "contact_phone": "841234567",
  "contact_email": "joao@example.com",
  "address": "Endereço do fornecedor",
  "notes": "Notas sobre o fornecedor"
}
```

### POST `/skypdv/suppliers/connect/fastfood`
Conectar um restaurante FastFood como fornecedor.

**Body:**
```json
{
  "restaurant_id": 5,
  "sync_products": true
}
```

**Nota:** Esta rota sincroniza automaticamente os produtos (Menu Items e Drinks) do restaurante FastFood para o PDV.

### POST `/skypdv/suppliers/{supplier_id}/sync`
Sincronizar manualmente produtos de um fornecedor externo (FastFood).

**Parâmetros:**
- `supplier_id` (path): ID do fornecedor

### PUT `/skypdv/suppliers/{supplier_id}`
Atualizar fornecedor.

**Body:**
```json
{
  "name": "Novo Nome",
  "contact_name": "Novo Contato",
  "contact_phone": "849876543",
  "contact_email": "novo@example.com",
  "address": "Novo Endereço",
  "notes": "Novas notas",
  "is_active": true
}
```

### DELETE `/skypdv/suppliers/{supplier_id}`
Desativar fornecedor.

---

## Produtos e Inventário

### GET `/skypdv/products`
Listar produtos com filtros.

**Query Parameters:**
- `search` (string, opcional): Buscar por nome, SKU ou código de barras
- `category` (string, opcional): Filtrar por categoria
- `source_type` (string, opcional): `local`, `fastfood`, `skyvenda`
- `skip` (int, padrão: 0): Paginação - pular registros
- `limit` (int, padrão: 100): Paginação - limite de registros

**Exemplo:**
```
GET /skypdv/products?search=arroz&category=Alimentos&source_type=local&skip=0&limit=50
```

**Resposta:**
```json
[
  {
    "id": 1,
    "terminal_id": 1,
    "supplier_id": 1,
    "source_type": "local",
    "external_product_id": null,
    "name": "Arroz 5kg",
    "sku": "ARZ-001",
    "barcode": "7891234567890",
    "description": "Arroz branco",
    "category": "Alimentos",
    "cost_price": "50.00",
    "price": "75.00",
    "promotional_price": null,
    "image": "url_da_imagem",
    "track_stock": true,
    "allow_decimal_quantity": false,
    "is_active": true,
    "inventory": {
      "quantity": "100.00",
      "min_quantity": "10.00",
      "max_quantity": null,
      "reserved_quantity": "0.00"
    },
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### POST `/skypdv/products`
Criar novo produto no PDV.

**Body:**
```json
{
  "name": "Novo Produto",
  "sku": "PROD-001",
  "barcode": "7891234567891",
  "description": "Descrição do produto",
  "category": "Categoria",
  "cost_price": "50.00",
  "price": "75.00",
  "promotional_price": "70.00",
  "image": "url_da_imagem",
  "track_stock": true,
  "allow_decimal_quantity": false,
  "supplier_id": 1,
  "initial_stock": "100.00"
}
```

### PUT `/skypdv/products/{product_id}`
Atualizar produto.

**Body:**
```json
{
  "name": "Nome Atualizado",
  "price": "80.00",
  "category": "Nova Categoria",
  "is_active": true
}
```

### DELETE `/skypdv/products/{product_id}`
Desativar um produto (marcar como inativo).

### GET `/skypdv/products/{product_id}/movements`
Histórico de movimentações de stock de um produto.

**Query Parameters:**
- `skip` (int, padrão: 0)
- `limit` (int, padrão: 100)

**Resposta:**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "terminal_id": 1,
    "movement_type": "in",
    "quantity": "50.00",
    "quantity_before": "100.00",
    "quantity_after": "150.00",
    "reference": "Compra #123",
    "reference_id": 123,
    "from_location": null,
    "to_location": null,
    "notes": "Entrada de estoque",
    "created_by": 1,
    "created_at": "2024-01-15T10:00:00"
  }
]
```

### GET `/skypdv/categories`
Listar todas as categorias de produtos (apenas nomes).

**Resposta:**
```json
["Alimentos", "Bebidas", "Limpeza", "Higiene"]
```

### POST `/skypdv/inventory/adjustment`
Ajustar estoque manual (entrada/saída/balanço).

**Body:**
```json
{
  "product_id": 1,
  "movement_type": "in",
  "quantity": "50.00",
  "notes": "Entrada de estoque",
  "reference": "NF-123",
  "storage_location": "balcao"
}
```

**Tipos de movimento:**
- `in`: Entrada de estoque
- `out`: Saída de estoque
- `adjustment`: Ajuste para valor absoluto
- `sale`: Venda (gerado automaticamente)
- `return`: Devolução
- `transfer`: Transferência entre locais

**Locais de armazenamento:**
- `balcao`: Balcão
- `congelado`: Congelado
- `armazem`: Armazém

### POST `/skypdv/inventory/transfer`
Transferir estoque entre localizações.

**Body:**
```json
{
  "product_id": 1,
  "from_location": "armazem",
  "to_location": "balcao",
  "quantity": "20.00",
  "notes": "Transferência para balcão"
}
```

### GET `/skypdv/inventory`
Relatório detalhado de inventário e stock baixo.

**Resposta:**
```json
{
  "total_products": 150,
  "total_value": "50000.00",
  "total_retail_value": "75000.00",
  "low_stock_count": 5,
  "out_of_stock_count": 2,
  "products": [
    {
      "id": 1,
      "product_id": 1,
      "terminal_id": 1,
      "quantity": "10.00",
      "min_quantity": "20.00",
      "max_quantity": null,
      "reserved_quantity": "0.00",
      "storage_location": "balcao",
      "last_restock_at": null,
      "last_count_at": null,
      "updated_at": "2024-01-15T10:00:00",
      "product_name": "Arroz 5kg",
      "product_sku": "ARZ-001"
    }
  ]
}
```

---

## Caixa (Cash Register)

### GET `/skypdv/cash-register/current`
Obter sessão do caixa atual (se houver).

**Resposta:**
```json
{
  "id": 1,
  "terminal_id": 1,
  "user_id": 123,
  "opened_at": "2024-01-15T08:00:00",
  "closed_at": null,
  "opening_amount": "500.00",
  "closing_amount": null,
  "expected_amount": null,
  "difference": null,
  "total_cash": "1500.00",
  "total_card": "800.00",
  "total_skywallet": "200.00",
  "total_mpesa": "100.00",
  "total_sales": "2600.00",
  "total_refunds": "0.00",
  "sales_count": 25,
  "refunds_count": 0,
  "status": "open",
  "notes": "Abertura do dia"
}
```

### POST `/skypdv/cash-register/open`
Abrir o caixa.

**Body:**
```json
{
  "opening_amount": "500.00",
  "notes": "Abertura do dia"
}
```

### POST `/skypdv/cash-register/close`
Fechar o caixa.

**Body:**
```json
{
  "closing_amount": "3000.00",
  "notes": "Fechamento do dia"
}
```

**Nota:** O sistema calcula automaticamente o valor esperado e a diferença.

---

## Vendas (Sales)

### POST `/skypdv/sales`
Registrar nova venda.

**Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "external_product_id": null,
      "source_type": "local",
      "quantity": "2.00",
      "unit_price": "75.00",
      "discount_amount": "0.00",
      "discount_percent": "0.00",
      "item_type": "menu_item",
      "notes": null
    },
    {
      "product_id": null,
      "external_product_id": 10,
      "source_type": "fastfood",
      "quantity": "1.00",
      "unit_price": null,
      "discount_amount": "0.00",
      "discount_percent": "0.00",
      "item_type": "drink",
      "notes": null
    }
  ],
  "customer_id": null,
  "customer_name": "João Silva",
  "customer_phone": "841234567",
  "payment_method": "cash",
  "amount_paid": "250.00",
  "discount_amount": "0.00",
  "discount_percent": "0.00",
  "sale_type": "local",
  "delivery_address": null,
  "delivery_notes": null,
  "notes": "Venda normal"
}
```

**Métodos de pagamento:**
- `cash`: Dinheiro
- `card`: Cartão
- `skywallet`: SkyWallet
- `mpesa`: M-Pesa
- `mixed`: Misto

**Tipos de venda:**
- `local`: Venda local
- `delivery`: Entrega
- `online`: Online

**Nota:** Para produtos FastFood, use `external_product_id` e `source_type: "fastfood"`. O sistema sincroniza automaticamente.

**Resposta:**
```json
{
  "id": 1,
  "terminal_id": 1,
  "cash_register_id": 1,
  "customer_id": null,
  "customer_name": "João Silva",
  "customer_phone": "841234567",
  "subtotal": "225.00",
  "discount_amount": "0.00",
  "discount_percent": "0.00",
  "tax_amount": "0.00",
  "total": "225.00",
  "payment_method": "cash",
  "payment_status": "paid",
  "amount_paid": "250.00",
  "change_amount": "25.00",
  "sale_type": "local",
  "status": "completed",
  "delivery_address": null,
  "delivery_notes": null,
  "external_order_id": null,
  "external_order_type": null,
  "notes": "Venda normal",
  "receipt_number": "VND-001",
  "items": [
    {
      "id": 1,
      "sale_id": 1,
      "product_id": 1,
      "product_name": "Arroz 5kg",
      "product_sku": "ARZ-001",
      "quantity": "2.00",
      "unit_price": "75.00",
      "discount_amount": "0.00",
      "discount_percent": "0.00",
      "subtotal": "150.00",
      "notes": null,
      "created_at": "2024-01-15T10:00:00"
    }
  ],
  "created_by": 123,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T10:00:00"
}
```

### GET `/skypdv/sales`
Listar histórico de vendas com filtros.

**Query Parameters:**
- `start_date` (datetime, opcional): Data inicial (formato: `2024-01-15T00:00:00`)
- `end_date` (datetime, opcional): Data final
- `source_type` (string, opcional): `fastfood`, `local`, etc.
- `payment_method` (string, opcional): `cash`, `card`, `skywallet`, `mpesa`
- `sale_type` (string, opcional): `local`, `delivery`, `online`
- `status` (string, padrão: `completed`): `completed`, `cancelled`, `all`
- `skip` (int, padrão: 0)
- `limit` (int, padrão: 50)

**Exemplo:**
```
GET /skypdv/sales?start_date=2024-01-01T00:00:00&end_date=2024-01-31T23:59:59&source_type=fastfood&limit=100
```

### GET `/skypdv/sales/{sale_id}`
Detalhes de uma venda específica.

### POST `/skypdv/sales/{sale_id}/void`
Anular uma venda e estornar stock/caixa.

**Nota:** Esta operação estorna o estoque e ajusta os valores do caixa.

---

## Dashboard e Relatórios

### GET `/skypdv/dashboard`
Estatísticas do dashboard PDV (Hoje/Mês/Top Produtos).

**Resposta:**
```json
{
  "today_sales": 15,
  "today_revenue": "2500.00",
  "today_profit": "500.00",
  "week_sales": 80,
  "week_revenue": "12000.00",
  "month_sales": 300,
  "month_revenue": "45000.00",
  "low_stock_alerts": 5,
  "out_of_stock": 2,
  "current_register_open": true,
  "current_register_total": "3000.00",
  "top_products": [
    {
      "product_id": 1,
      "product_name": "Arroz 5kg",
      "category": "Alimentos",
      "quantity_sold": "100.00",
      "revenue": "7500.00",
      "profit": "2500.00"
    }
  ],
  "payment_breakdown": {
    "cash": {
      "amount": 20000.00,
      "percentage": 44.4
    },
    "card": {
      "amount": 15000.00,
      "percentage": 33.3
    },
    "skywallet": {
      "amount": 10000.00,
      "percentage": 22.2
    }
  }
}
```

### GET `/skypdv/reports/sales-summary`
Gerar relatório resumido de vendas para um período livre.

**Query Parameters:**
- `start_date` (datetime, opcional): Se não informado, assume início do mês atual
- `end_date` (datetime, opcional): Se não informado, assume data atual

**Resposta:**
```json
{
  "period_start": "2024-01-01T00:00:00",
  "period_end": "2024-01-31T23:59:59",
  "total_sales": 300,
  "total_revenue": "45000.00",
  "total_cost": "30000.00",
  "gross_profit": "15000.00",
  "average_sale_value": "150.00",
  "total_items_sold": 500,
  "total_discounts": "500.00",
  "total_taxes": "0.00",
  "cash_sales": "20000.00",
  "card_sales": "15000.00",
  "skywallet_sales": "10000.00",
  "mpesa_sales": "0.00",
  "voided_sales": 5,
  "voided_amount": "750.00"
}
```

### GET `/skypdv/reports/periodic`
Relatório simplificado por Dia, Mês ou Ano.

**Query Parameters:**
- `period` (string, obrigatório): `day`, `month`, `year`
- `date` (string, obrigatório): 
  - Para `day`: `2024-01-21`
  - Para `month`: `2024-01`
  - Para `year`: `2024`

**Exemplo:**
```
GET /skypdv/reports/periodic?period=month&date=2024-01
```

### GET `/skypdv/reports/detailed-monthly`
Relatório mensal detalhado com breakdown diário, top produtos, categorias, etc.

**Query Parameters:**
- `year` (int, obrigatório): Ano (ex: 2024)
- `month` (int, obrigatório): Mês (1-12)

**Resposta:**
```json
{
  "year": 2024,
  "month": 1,
  "month_name": "January",
  "summary": { /* SalesSummary */ },
  "daily_breakdown": [
    {
      "period": "2024-01-15",
      "sales_count": 10,
      "total_revenue": "1500.00",
      "average_value": "150.00"
    }
  ],
  "top_products": [ /* TopProduct[] */ ],
  "top_categories": [
    {
      "category": "Alimentos",
      "revenue": 20000.00,
      "quantity": 300
    }
  ],
  "payment_method_breakdown": {
    "cash": {
      "count": 150,
      "total": 20000.00,
      "percentage": 44.4
    }
  },
  "comparison_previous_month": {
    "previous_month_revenue": 40000.00,
    "previous_month_sales": 280,
    "revenue_change_percent": 12.5,
    "sales_change_percent": 7.1
  }
}
```

### GET `/skypdv/reports/detailed-yearly`
Relatório anual detalhado com breakdown mensal, comparação, tendências, etc.

**Query Parameters:**
- `year` (int, obrigatório): Ano (ex: 2024)

### GET `/skypdv/reports/top-products`
Relatório de produtos mais vendidos em um período.

**Query Parameters:**
- `start_date` (datetime, opcional): Se não informado, assume início do mês atual
- `end_date` (datetime, opcional): Se não informado, assume data atual
- `limit` (int, padrão: 20): Número de produtos a retornar

### GET `/skypdv/reports/sales-by-day`
Breakdown de vendas por dia em um período (útil para gráficos).

**Query Parameters:**
- `start_date` (datetime, opcional)
- `end_date` (datetime, opcional)

**Resposta:**
```json
[
  {
    "period": "2024-01-15",
    "sales_count": 10,
    "total_revenue": "1500.00",
    "average_value": "150.00"
  }
]
```

---

## Categorias

### GET `/skypdv/categories-list`
Listar todas as categorias cadastradas (completo).

**Resposta:**
```json
[
  {
    "id": 1,
    "terminal_id": 1,
    "is_global": false,
    "created_by": 123,
    "name": "Alimentos",
    "description": "Categoria de alimentos",
    "icon": "food-icon",
    "color": "#FF5733",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### POST `/skypdv/categories-list`
Criar nova categoria (pessoal ou global).

**Query Parameters:**
- `is_global` (bool, padrão: false): Se true, cria categoria global (compartilhada)

**Body:**
```json
{
  "name": "Nova Categoria",
  "description": "Descrição da categoria",
  "icon": "icon-name",
  "color": "#FF5733"
}
```

### POST `/skypdv/categories-list/{category_id}/adopt`
Adotar uma categoria global para o seu terminal.

### PUT `/skypdv/categories-list/{category_id}`
Atualizar categoria.

**Body:**
```json
{
  "name": "Nome Atualizado",
  "description": "Nova descrição",
  "icon": "new-icon",
  "color": "#00FF00",
  "is_active": true
}
```

### DELETE `/skypdv/categories-list/{category_id}`
Desativar categoria.

---

## Métodos de Pagamento

### GET `/skypdv/payment-methods`
Listar todos os métodos de pagamento cadastrados.

**Resposta:**
```json
[
  {
    "id": 1,
    "terminal_id": 1,
    "is_global": false,
    "created_by": 123,
    "name": "Dinheiro",
    "description": "Pagamento em dinheiro",
    "icon": "cash-icon",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### POST `/skypdv/payment-methods`
Criar novo método de pagamento (pessoal ou global).

**Query Parameters:**
- `is_global` (bool, padrão: false)

**Body:**
```json
{
  "name": "Cartão de Crédito",
  "description": "Pagamento com cartão",
  "icon": "card-icon"
}
```

### POST `/skypdv/payment-methods/{method_id}/adopt`
Adotar um método de pagamento global para o seu terminal.

### PUT `/skypdv/payment-methods/{method_id}`
Atualizar método de pagamento.

**Body:**
```json
{
  "name": "Nome Atualizado",
  "description": "Nova descrição",
  "icon": "new-icon",
  "is_active": true
}
```

### DELETE `/skypdv/payment-methods/{method_id}`
Desativar método de pagamento.

---

## Rotas FastFood Necessárias

O SkyPDV gerencia PDV de restaurante também, então o frontend precisa acessar algumas rotas do FastFood.

**Base URL:** `/fastfood`

### GET `/fastfood/restaurants/mine`
Obter restaurantes do usuário atual.

**Resposta:**
```json
[
  {
    "id": 1,
    "user_id": 123,
    "name": "Restaurante XYZ",
    "category": "Pizza",
    "province": "Maputo",
    "district": "KaMavota",
    "neighborhood": "Bairro X",
    "avenue": "Avenida Y",
    "location_google_maps": "https://maps.google.com/...",
    "opening_time": "08:00:00",
    "closing_time": "22:00:00",
    "open_days": "Segunda-Sexta",
    "min_delivery_value": "100.00",
    "latitude": -25.969248,
    "longitude": 32.573228,
    "slug": "restaurante-xyz",
    "is_open": true,
    "active": true,
    "rating": 4.5,
    "total_reviews": 50,
    "cover_image": "url_cover",
    "images": "url_images",
    "menus": [],
    "drinks": [],
    "employees": [],
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### GET `/fastfood/manage`
Obter dados completos do restaurante do usuário (dashboard administrativo).

**Resposta:**
```json
{
  "restaurant": { /* Restaurant completo */ },
  "sales_overview": {
    "total_orders": 150,
    "total_revenue": "15000.00",
    "average_order_value": "100.00",
    "pending_orders": 5,
    "completed_orders": 140,
    "cancelled_orders": 5
  },
  "recent_orders": [
    {
      "id": 1,
      "user_id": 456,
      "customer_name": "Cliente ABC",
      "status": "completed",
      "total_value": "150.00",
      "created_at": "2024-01-15T10:00:00",
      "items_count": 3
    }
  ],
  "pdv_connected": true,
  "owner": {
    "id": 123,
    "name": "João Silva",
    "username": "joao",
    "profile_photo": "url_photo"
  }
}
```

### GET `/fastfood/restaurants/{restaurant_id}/menus/`
Obter todos os menus de um restaurante.

**Resposta:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "name": "Menu Principal",
    "slug": "menu-principal",
    "items": [
      {
        "id": 1,
        "menu_id": 1,
        "name": "Pizza Margherita",
        "description": "Pizza com tomate e queijo",
        "price": "250.00",
        "image": "url_image"
      }
    ],
    "drinks": [],
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### GET `/fastfood/restaurants/{restaurant_id}/drinks/`
Obter todas as bebidas de um restaurante.

**Query Parameters:**
- `skip` (int, padrão: 0)
- `limit` (int, padrão: 100)

**Resposta:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "name": "Coca-Cola",
    "stock": 50,
    "price": "30.00",
    "photo": "url_photo"
  }
]
```

### GET `/fastfood/restaurants/{restaurant_id}/orders/`
Obter pedidos de um restaurante (apenas para dono/funcionários autorizados).

**Resposta:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "user_id": 456,
    "customer_name": "Cliente ABC",
    "customer_phone": "841234567",
    "status": "completed",
    "order_type": "local",
    "total_value": "150.00",
    "payment_method": "cash",
    "payment_status": "paid",
    "paid_at": "2024-01-15T10:00:00",
    "estimated_delivery_time": null,
    "items": [
      {
        "id": 1,
        "item_type": "menu_item",
        "item_id": 1,
        "quantity": 2,
        "price": "250.00",
        "name": "Pizza Margherita"
      }
    ],
    "tab_id": null,
    "table_id": null,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### GET `/fastfood/restaurants/{restaurant_id}/overview`
Obter resumo de vendas do restaurante.

**Resposta:**
```json
{
  "total_orders": 150,
  "total_revenue": "15000.00",
  "average_order_value": "100.00",
  "pending_orders": 5,
  "completed_orders": 140,
  "cancelled_orders": 5
}
```

### GET `/fastfood/restaurants/{restaurant_id}/popular-items`
Obter itens mais vendidos do restaurante.

**Query Parameters:**
- `limit` (int, padrão: 5)

**Resposta:**
```json
[
  {
    "name": "Pizza Margherita",
    "orders_count": 50,
    "image": "url_image",
    "price": "250.00",
    "item_type": "menu_item"
  }
]
```

### GET `/fastfood/restaurants/{restaurant_id}/tables`
Listar todas as mesas de um restaurante.

**Resposta:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "table_number": "Mesa 1",
    "seats": 4,
    "shape": "square",
    "width": 1.2,
    "height": 1.2,
    "position_x": 100.0,
    "position_y": 200.0,
    "status": "available",
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### GET `/fastfood/restaurants/{restaurant_id}/tabs`
Listar todas as contas (Tabs) de um restaurante.

**Query Parameters:**
- `status` (string, padrão: `open`): `open`, `closed`

**Resposta:**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "client_name": "Cliente ABC",
    "client_phone": "841234567",
    "status": "open",
    "current_balance": "150.00",
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

---

## Notas Importantes

### Integração SkyPDV ↔ FastFood

1. **Conexão Automática:** Quando um usuário tem um restaurante FastFood, o SkyPDV automaticamente cria uma conexão como fornecedor ao obter o terminal.

2. **Sincronização de Produtos:**
   - Menu Items do FastFood são sincronizados como produtos PDV com `source_type: "fastfood"`
   - Drinks do FastFood também são sincronizados
   - SKU gerado automaticamente: `FF-ITEM-{item_id}` ou `FF-DRINK-{drink_id}`

3. **Vendas Integradas:**
   - Vendas do FastFood podem ser registradas no SkyPDV automaticamente
   - Use `external_product_id` e `source_type: "fastfood"` ao criar vendas com produtos FastFood
   - O sistema sincroniza o estoque de drinks automaticamente

4. **Estoque:**
   - Produtos FastFood sincronizados têm `track_stock: false` por padrão
   - Para drinks, o estoque é sincronizado bidirecionalmente

### Autenticação

Todas as rotas requerem autenticação via Bearer Token:

```
Authorization: Bearer {token}
```

O token é obtido através da rota de login padrão do sistema (`/login`).

### Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Erro de validação
- `401`: Não autenticado
- `403`: Não autorizado
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Formato de Datas

Use formato ISO 8601:
- `2024-01-15T10:00:00`
- `2024-01-15T10:00:00Z` (UTC)
- `2024-01-15T10:00:00+02:00` (com timezone)

### Valores Monetários

Todos os valores monetários são retornados como strings no formato decimal:
- `"150.00"`
- `"0.50"`

---

**Última atualização:** 2024-01-15

