# Guia de Integração - Hotel Management API

Este guia fornece informações detalhadas para integração com a API do Sistema de Gestão de Hotel.

## 🔑 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Todas as rotas protegidas requerem um token válido no header `Authorization`.

### Obter Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "role": "customer"
  }
}
```

### Usar Token

Inclua o token no header de todas as requisições protegidas:

```http
GET /rooms
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token

Quando o access token expirar, use o refresh token para obter um novo:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📋 Endpoints Principais

### Quartos

#### Listar Quartos
```http
GET /rooms?page=1&limit=10&type=single&minPrice=100&maxPrice=500
Authorization: Bearer {token}
```

**Parâmetros de Query:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)
- `type` (string): Tipo de quarto (single, double, suite, etc.)
- `minPrice` (number): Preço mínimo
- `maxPrice` (number): Preço máximo
- `search` (string): Busca por texto
- `sortBy` (string): Campo para ordenação (price, rating, createdAt)
- `sortOrder` (string): Ordem (ASC, DESC)

#### Verificar Disponibilidade
```http
GET /rooms/availability?checkIn=2024-01-15&checkOut=2024-01-20
Authorization: Bearer {token}
```

#### Obter Detalhes do Quarto
```http
GET /rooms/{id}
Authorization: Bearer {token}
```

### Reservas

#### Criar Reserva
```http
POST /reservations
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomId": "uuid-do-quarto",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-20",
  "guestNotes": "Quarto com vista para o mar",
  "couponCode": "DESCONTO10" // opcional
}
```

**Resposta:**
```json
{
  "id": "uuid-da-reserva",
  "userId": "uuid-do-usuario",
  "roomId": "uuid-do-quarto",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-20",
  "totalPrice": 750.0,
  "discountAmount": 75.0,
  "couponCode": "DESCONTO10",
  "status": "pending",
  "createdAt": "2024-01-10T10:00:00Z"
}
```

#### Listar Reservas do Usuário
```http
GET /users/me/reservations?page=1&limit=10&status=confirmed
Authorization: Bearer {token}
```

#### Cancelar Reserva
```http
PATCH /reservations/{id}/cancel
Authorization: Bearer {token}
```

### Pagamentos

#### Processar Pagamento
```http
POST /payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "reservationId": "uuid-da-reserva",
  "paymentMethod": "credit_card",
  "cardNumber": "4111111111111111",
  "cardExpiry": "12/25",
  "cardCVC": "123"
}
```

**Resposta:**
```json
{
  "id": "uuid-do-pagamento",
  "reservationId": "uuid-da-reserva",
  "amount": 675.0,
  "status": "completed",
  "paymentMethod": "credit_card",
  "createdAt": "2024-01-10T10:05:00Z"
}
```

### Avaliações

#### Criar Avaliação
```http
POST /reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomId": "uuid-do-quarto",
  "reservationId": "uuid-da-reserva",
  "rating": 5,
  "comment": "Excelente quarto, muito confortável!"
}
```

#### Listar Avaliações do Quarto
```http
GET /reviews/room/{roomId}?page=1&limit=10
```

### Cupons

#### Validar Cupom
```http
GET /coupons/validate/{code}
Authorization: Bearer {token}
```

#### Listar Cupons (Admin)
```http
GET /coupons
Authorization: Bearer {token}
```

### Check-in Digital

#### Obter QR Code
```http
GET /checkin/qr-code/{reservationId}
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "token": "qr-token-unico"
}
```

#### Validar QR Code
```http
POST /checkin/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "token": "qr-token-unico"
}
```

## 🔒 Roles e Permissões

### Customer (Cliente)
- Criar e gerenciar próprias reservas
- Fazer pagamentos
- Criar avaliações
- Acessar perfil e histórico

### Admin (Administrador)
- Todas as permissões de customer
- Gerenciar quartos (CRUD)
- Gerenciar reservas de todos os usuários
- Gerenciar cupons
- Acessar relatórios
- Gerenciar hotéis (multi-tenant)
- Gerenciar bloqueios de períodos

## 📊 Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: email já cadastrado)
- `429 Too Many Requests` - Rate limit excedido
- `500 Internal Server Error` - Erro do servidor

## ⚠️ Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
```

## 🔄 Paginação

Endpoints que retornam listas suportam paginação:

**Query Parameters:**
- `page` (number): Número da página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10, máximo: 100)

**Resposta:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## 🌐 Multi-tenant

Para sistemas multi-tenant, inclua o header `X-Hotel-Id` nas requisições:

```http
GET /rooms
Authorization: Bearer {token}
X-Hotel-Id: uuid-do-hotel
```

## 📱 Webhooks

A API pode enviar webhooks para eventos importantes:

- `reservation.created` - Nova reserva criada
- `reservation.confirmed` - Reserva confirmada
- `reservation.cancelled` - Reserva cancelada
- `payment.completed` - Pagamento concluído
- `checkin.completed` - Check-in realizado

## 🔗 Recursos Adicionais

- **Swagger UI**: http://localhost:3000/api
- **Documentação Completa**: Veja o README.md
- **Código Fonte**: https://github.com/your-repo

## 💡 Exemplos de Integração

### JavaScript/TypeScript (Axios)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Login
const { data } = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123',
});

// Configurar token
api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

// Criar reserva
const reservation = await api.post('/reservations', {
  roomId: 'uuid',
  checkIn: '2024-01-15',
  checkOut: '2024-01-20',
});
```

### cURL
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Listar quartos
curl -X GET http://localhost:3000/rooms \
  -H "Authorization: Bearer {token}"
```

## 🆘 Suporte

Para dúvidas ou problemas na integração:
- Email: support@hotel.com
- Documentação: http://localhost:3000/api
- Issues: https://github.com/your-repo/issues

