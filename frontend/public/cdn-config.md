# Configuração de CDN para Assets Estáticos

Este documento descreve como configurar um CDN (Content Delivery Network) para servir assets estáticos do sistema de gestão de hotel.

## 📦 O que é CDN?

Um CDN é uma rede de servidores distribuídos geograficamente que armazena cópias de conteúdo estático (imagens, CSS, JavaScript, fontes) para reduzir a latência e melhorar o desempenho da aplicação.

## 🎯 Benefícios

- **Performance**: Redução significativa no tempo de carregamento
- **Escalabilidade**: Suporte a alto tráfego sem sobrecarregar o servidor principal
- **Disponibilidade**: Redundância em múltiplos servidores
- **Economia de banda**: Reduz o uso de banda do servidor principal

## 🔧 Opções de CDN

### 1. Cloudflare (Recomendado para começar)

**Vantagens:**
- Plano gratuito disponível
- Fácil configuração
- Proteção DDoS incluída
- Cache automático

**Configuração:**
1. Crie uma conta em [Cloudflare](https://www.cloudflare.com)
2. Adicione seu domínio
3. Configure os registros DNS
4. Ative o cache automático para assets estáticos

### 2. AWS CloudFront

**Vantagens:**
- Integração com S3
- Controle granular de cache
- Suporte a HTTPS
- Análise detalhada

**Configuração:**
```bash
# 1. Configure o bucket S3 para hospedar assets
aws s3 sync ./frontend/dist/assets s3://seu-bucket/assets --cache-control "public, max-age=31536000"

# 2. Crie uma distribuição CloudFront
aws cloudfront create-distribution \
  --origin-domain-name seu-bucket.s3.amazonaws.com \
  --default-root-object index.html
```

### 3. Vercel / Netlify (Para deploy completo)

**Vantagens:**
- Deploy automático
- CDN incluído
- Otimização automática de imagens
- HTTPS automático

## 📝 Configuração no Frontend

### Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# CDN Configuration
VITE_CDN_URL=https://cdn.seudominio.com
VITE_ASSETS_URL=https://cdn.seudominio.com/assets
```

### Atualizar Vite Config

Edite `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_CDN_URL || '/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
```

### Componente para Imagens com CDN

Crie `src/utils/cdn.ts`:

```typescript
/**
 * Retorna a URL completa de um asset usando CDN
 */
export const getCdnUrl = (path: string): string => {
  const cdnUrl = import.meta.env.VITE_CDN_URL;
  if (!cdnUrl) return path;
  
  // Remove barra inicial se existir
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cdnUrl}/${cleanPath}`;
};

/**
 * Retorna a URL de uma imagem de quarto
 */
export const getRoomImageUrl = (imageUrl: string | null): string => {
  if (!imageUrl) return '/placeholder-room.jpg';
  
  // Se já é uma URL completa, retornar como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se é um caminho relativo, usar CDN
  return getCdnUrl(imageUrl);
};
```

## 🚀 Deploy de Assets

### Script de Deploy

Crie `scripts/deploy-cdn.sh`:

```bash
#!/bin/bash

# Configurações
BUCKET_NAME="seu-bucket-s3"
CDN_URL="https://cdn.seudominio.com"

# Build do frontend
cd frontend
npm run build

# Upload para S3
aws s3 sync dist/ s3://$BUCKET_NAME \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "service-worker.js"

# Upload de HTML com cache curto
aws s3 sync dist/ s3://$BUCKET_NAME \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"

# Invalidar cache do CloudFront (se aplicável)
aws cloudfront create-invalidation \
  --distribution-id SEU_DISTRIBUTION_ID \
  --paths "/*"

echo "Deploy concluído! CDN: $CDN_URL"
```

## 📊 Monitoramento

### Métricas Importantes

- **Cache Hit Rate**: Taxa de acertos no cache
- **Latência**: Tempo de resposta do CDN
- **Bandwidth**: Uso de banda
- **Requests**: Número de requisições

### Ferramentas

- **Cloudflare Analytics**: Dashboard integrado
- **AWS CloudWatch**: Métricas detalhadas do CloudFront
- **Google Analytics**: Rastreamento de performance

## 🔒 Segurança

### HTTPS

Certifique-se de que o CDN suporta HTTPS:

```typescript
// Forçar HTTPS em produção
const cdnUrl = process.env.NODE_ENV === 'production' 
  ? 'https://cdn.seudominio.com'
  : 'http://localhost:5173';
```

### CORS

Configure CORS no CDN para permitir requisições do seu domínio:

```json
{
  "AllowedOrigins": ["https://seudominio.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

## 🎨 Otimização de Imagens

### Compressão

Use ferramentas para comprimir imagens antes do upload:

```bash
# Instalar sharp-cli
npm install -g sharp-cli

# Comprimir imagens
sharp -i uploads/*.jpg -o uploads/compressed/ -q 80
```

### Formatos Modernos

Considere usar WebP ou AVIF para melhor compressão:

```typescript
// Detectar suporte a WebP
const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Usar WebP se suportado
const imageUrl = supportsWebP() 
  ? room.imageUrl?.replace('.jpg', '.webp')
  : room.imageUrl;
```

## 📚 Recursos Adicionais

- [Cloudflare CDN Docs](https://developers.cloudflare.com/cache/)
- [AWS CloudFront Guide](https://docs.aws.amazon.com/cloudfront/)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Web.dev - CDN Guide](https://web.dev/cdn/)

## ✅ Checklist de Implementação

- [ ] Escolher provedor de CDN
- [ ] Configurar variáveis de ambiente
- [ ] Atualizar `vite.config.ts`
- [ ] Criar utilitários de CDN
- [ ] Atualizar componentes para usar CDN
- [ ] Configurar script de deploy
- [ ] Testar em ambiente de desenvolvimento
- [ ] Deploy em produção
- [ ] Monitorar performance
- [ ] Otimizar baseado em métricas
