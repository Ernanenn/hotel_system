# Guia de Testes

Este documento descreve a estrutura de testes do projeto e como executá-los.

## Estrutura de Testes

### Testes Unitários
Os testes unitários estão localizados junto com os arquivos de código, seguindo o padrão `*.spec.ts`:

- `src/**/*.spec.ts` - Testes unitários dos services

### Testes E2E
Os testes end-to-end estão localizados na pasta `test/`:

- `test/*.e2e-spec.ts` - Testes E2E completos

## Executando os Testes

### Todos os Testes
```bash
npm test
```

### Testes em Modo Watch
```bash
npm run test:watch
```

### Testes com Cobertura
```bash
npm run test:cov
```

### Testes E2E
```bash
npm run test:e2e
```

## Cobertura de Testes

O projeto tem como objetivo manter uma cobertura mínima de 70% em:
- Branches
- Functions
- Lines
- Statements

## Estrutura dos Testes E2E

### Auth E2E (`test/auth.e2e-spec.ts`)
- Registro de usuário
- Login
- Validação de token
- Tratamento de erros

### Reservations E2E (`test/reservations.e2e-spec.ts`)
- Criação de reservas
- Listagem de reservas
- Validação de datas
- Detalhes de reserva

### Payments E2E (`test/payments.e2e-spec.ts`)
- Criação de sessão de checkout
- Simulação de pagamento
- Validação de sessões

## CI/CD

Os testes são executados automaticamente no GitHub Actions em:
- Push para branches `main` ou `develop`
- Pull requests para `main` ou `develop`

O workflow CI inclui:
- Linting
- Testes unitários com cobertura
- Testes E2E
- Upload de cobertura para Codecov

## Requisitos para Testes E2E

Os testes E2E requerem:
- PostgreSQL rodando (configurado via docker-compose ou serviço)
- Redis rodando (opcional, mas recomendado)
- Variáveis de ambiente configuradas no `.env.test`

## Mocking

Os testes unitários usam mocks para:
- Repositórios TypeORM
- Serviços externos
- Configurações

Isso garante que os testes sejam rápidos e não dependam de serviços externos.

