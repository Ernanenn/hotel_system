# Sistema de Gestão de Hotel

Sistema completo de gestão de hotel desenvolvido com NestJS (backend) e React/TypeScript (frontend), incluindo funcionalidades de reservas, pagamentos, avaliações, relatórios, multi-tenant, check-in digital, PWA e conformidade GDPR/LGPD.

## 🚀 Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados relacional
- **TypeORM** - ORM para PostgreSQL
- **JWT** - Autenticação e autorização
- **Swagger/OpenAPI** - Documentação da API
- **Redis** - Cache e rate limiting
- **Pino** - Logging estruturado
- **Sentry** - Monitoramento de erros

### Frontend
- **React** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Chakra UI** - Componentes UI
- **React Router** - Roteamento
- **Zod** - Validação de formulários
- **React Hook Form** - Gerenciamento de formulários
- **Axios** - Cliente HTTP
- **React Big Calendar** - Calendário de disponibilidade
- **Recharts** - Gráficos e relatórios

## 📋 Funcionalidades

### Autenticação e Autorização
- ✅ Login e registro de usuários
- ✅ JWT tokens com refresh tokens
- ✅ Roles (customer, admin)
- ✅ Proteção de rotas com guards

### Gerenciamento de Quartos
- ✅ CRUD de quartos
- ✅ Upload de imagens (local/S3)
- ✅ Busca avançada com filtros
- ✅ Verificação de disponibilidade
- ✅ Calendário de ocupação
- ✅ Sistema de avaliações (1-5 estrelas)

### Reservas
- ✅ Criação de reservas com validação
- ✅ Aplicação de cupons de desconto
- ✅ Cálculo automático de preços
- ✅ Status de reserva (pending, confirmed, cancelled, completed)
- ✅ Histórico completo de reservas

### Pagamentos
- ✅ Sistema de pagamento simulado (mock)
- ✅ Processamento de pagamentos
- ✅ Histórico de transações

### Check-in Digital
- ✅ Geração de QR codes para reservas
- ✅ Validação de QR codes
- ✅ Notificações automáticas de check-in/check-out

### Cupons
- ✅ Criação e gerenciamento de cupons
- ✅ Validação de cupons (validade, uso máximo)
- ✅ Aplicação de descontos

### Relatórios
- ✅ Relatórios de receita
- ✅ Análise de ocupação
- ✅ Quartos mais populares
- ✅ Exportação em Excel e PDF

### Multi-tenant
- ✅ Suporte a múltiplos hotéis
- ✅ Filtros automáticos por hotel
- ✅ Gerenciamento de hotéis

### PWA e Notificações
- ✅ Progressive Web App (PWA)
- ✅ Service Worker para offline
- ✅ Notificações push no navegador
- ✅ Instalação como app

### GDPR/LGPD
- ✅ Exportação de dados pessoais (JSON/CSV)
- ✅ Exclusão de conta com anonimização
- ✅ Política de privacidade
- ✅ Termos de uso

### Performance e Otimização
- ✅ Cache Redis para queries frequentes (rooms, availability)
- ✅ Otimização de queries do banco (eager loading, índices)
- ✅ Virtualização de listas grandes (react-window)
- ✅ Infinite scroll para listagem de quartos
- ✅ Lazy loading de componentes
- ✅ Documentação para configuração de CDN

### Outros
- ✅ Sistema de bloqueio de períodos (manutenção, eventos)
- ✅ Preferências de notificação
- ✅ Perfil de usuário completo
- ✅ Internacionalização (pt-BR, en-US)
- ✅ Rate limiting por usuário
- ✅ Logging estruturado
- ✅ Monitoramento de erros (Sentry)
- ✅ Testes unitários e E2E
- ✅ CI/CD com GitHub Actions

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ e npm
- PostgreSQL 14+
- Redis (opcional, para cache e rate limiting)

### Configuração

1. Clone o repositório:
```bash
git clone <repository-url>
cd "Projeto hotel"
```

2. Instale as dependências:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=hotel_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Sentry (opcional)
SENTRY_DSN=your-sentry-dsn

# Upload
UPLOAD_DEST=./uploads
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Frontend
VITE_API_URL=http://localhost:3000
```

4. Configure o banco de dados:
```bash
# Crie o banco de dados no PostgreSQL
createdb hotel_db

# Execute as migrations (se houver)
cd backend
npm run migration:run
```

5. Inicie os servidores:
```bash
# Backend (porta 3000)
cd backend
npm run start:dev

# Frontend (porta 5173)
cd frontend
npm run dev
```

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger quando o backend estiver rodando:

- **Swagger UI**: http://localhost:3000/api

A documentação inclui:
- Todos os endpoints disponíveis
- Parâmetros de requisição e resposta
- Exemplos de uso
- Schemas de validação
- Autenticação JWT

## 🧪 Testes

### Backend
```bash
cd backend

# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

### Frontend
```bash
cd frontend

# Testes
npm run test
```

## 🏗️ Estrutura do Projeto

```
Projeto hotel/
├── backend/
│   ├── src/
│   │   ├── auth/           # Autenticação
│   │   ├── users/          # Usuários
│   │   ├── rooms/          # Quartos
│   │   ├── reservations/   # Reservas
│   │   ├── payments/       # Pagamentos
│   │   ├── reviews/         # Avaliações
│   │   ├── reports/        # Relatórios
│   │   ├── coupons/        # Cupons
│   │   ├── checkin/         # Check-in digital
│   │   ├── hotels/         # Multi-tenant
│   │   ├── room-blocks/    # Bloqueios de períodos
│   │   ├── notifications/  # Notificações
│   │   ├── upload/         # Upload de arquivos
│   │   ├── push/           # Push notifications
│   │   └── main.ts         # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas
│   │   ├── services/       # API clients
│   │   ├── context/        # Context API
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilitários
│   │   └── types/          # TypeScript types
│   └── package.json
└── README.md
```

## 🔐 Segurança

- ✅ Helmet para headers de segurança HTTP
- ✅ Rate limiting por usuário
- ✅ Validação de dados com class-validator
- ✅ Sanitização de inputs
- ✅ JWT com tokens seguros
- ✅ CORS configurado
- ✅ Proteção contra SQL injection (TypeORM)
- ✅ Proteção contra XSS

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de enviar pull requests.
