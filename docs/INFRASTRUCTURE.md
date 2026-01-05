# 🏗️ Infraestrutura Nexa

> Documentação atualizada em: 02/01/2026

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXA ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │   Frontend  │     │   Backend   │     │    Chat     │                   │
│   │  (Next.js)  │────▶│  (Laravel)  │────▶│  (Reverb)   │                   │
│   │  Cloud Run  │     │  Cloud Run  │     │  Cloud Run  │                   │
│   └─────────────┘     └──────┬──────┘     └─────────────┘                   │
│                              │                                               │
│         ┌────────────────────┼────────────────────┐                         │
│         ▼                    ▼                    ▼                         │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐                     │
│   │ Supabase  │       │   GCP     │       │  Upstash  │                     │
│   │ PostgreSQL│       │  Storage  │       │   Redis   │                     │
│   │  (FREE)   │       │  (FREE)   │       │  (FREE)   │                     │
│   └───────────┘       └───────────┘       └───────────┘                     │
│                              │                                               │
│                              ▼                                               │
│                       ┌───────────┐                                         │
│                       │  AWS SES  │                                         │
│                       │  (Email)  │                                         │
│                       └───────────┘                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Estimativa de Custos Mensal

| Serviço | Provedor | Tier | Custo Estimado |
|---------|----------|------|----------------|
| **Database** | Supabase | Free (500MB) | **$0** |
| **Storage** | GCP Cloud Storage | Free (5GB) | **$0** |
| **Backend** | GCP Cloud Run | Pay-per-use | **$0 - $5** |
| **Frontend** | GCP Cloud Run | Pay-per-use | **$0 - $5** |
| **Chat (WebSocket)** | GCP Cloud Run | Pay-per-use | **$0 - $3** |
| **Redis/Cache** | Upstash | Free (10K req/dia) | **$0** |
| **Email** | AWS SES | $0.10/1000 emails | **~$0.50** |
| **DNS/Domain** | Externo | - | Variável |

### 📈 **TOTAL ESTIMADO: $0 - $15 USD/mês**

> **Nota:** Em baixo tráfego, praticamente tudo cai no free tier. O custo aumenta proporcionalmente ao uso.

---

## 🔧 Serviços Detalhados

### 1. Database - Supabase PostgreSQL

**URL de Conexão:**
```
Host: db.iuyapitbtdeoktaeqjai.supabase.co
Port: 5432
Database: postgres
User: postgres

> **Gestão:** O projeto utiliza **Supabase CLI** e **Supabase MCP** para migrações e gerenciamento direto via interface de comando e inteligência artificial.
```

**Limites Free Tier:**
- 500MB de armazenamento
- Bandwidth ilimitado
- 50K rows máximo por tabela (soft limit)

**Dashboard:** https://supabase.com/dashboard/project/iuyapitbtdeoktaeqjai

---

### 2. Storage - GCP Cloud Storage

**Bucket Principal:** `nexa-uploads-prod`
**Região:** `southamerica-east1` (São Paulo)

**Uso:**
- Upload de imagens de campanha
- Avatares de usuários
- Materiais de entrega
- Arquivos de portfólio

**Configuração no Laravel:**
```php
'gcs' => [
    'driver' => 'gcs',
    'project_id' => env('GOOGLE_CLOUD_PROJECT_ID'),
    'bucket' => env('GOOGLE_CLOUD_STORAGE_BUCKET'),
]
```

**Estrutura de Diretórios:**
- `/portfolio/{user_id}/` - Imagens de portfólio
- `/chat-files/` - Arquivos compartilhados no chat
- `/direct-chat-files/` - Arquivos de mensagens diretas de conexão
- `/delivery-materials/` - Materiais entregues em contratos
- `/avatars/` - Fotos de perfil de usuários
- `/videos/steps/` - Vídeos de passos de guias
- `/screenshots/steps/` - Screenshots de guias
- `/campaigns/images/` - Imagens de capa de campanhas
- `/campaigns/logos/` - Logos de marcas
- `/campaigns/attachments/` - Anexos de briefing

---

### 3. Compute - GCP Cloud Run

#### Frontend (nexa-frontend)
- **URL:** https://nexa-frontend-1044548850970.southamerica-east1.run.app
- **Framework:** Next.js
- **Recursos:** 1 vCPU, 512Mi RAM
- **Scaling:** 0-2 instâncias

#### Backend (nexa-backend2)
- **URL:** https://nexa-backend2-1044548850970.southamerica-east1.run.app
- **Framework:** Laravel 11
- **Recursos:** 1 vCPU, 256Mi RAM
- **Scaling:** 0-2 instâncias

#### Chat/WebSocket (nexa-chat)
- **URL:** https://nexa-chat-bwld7w5onq-rj.a.run.app
- **Framework:** Laravel Reverb
- **Recursos:** 1 vCPU, 256Mi RAM

---

### 4. Cache - Upstash Redis

**Host:** `grand-mastiff-18934.upstash.io`
**Port:** 6379
**Scheme:** TLS

**Uso:**
- Cache de sessões
- Rate limiting
- Filas (opcional)

---

### 5. Email - AWS SES

**Região:** `sa-east-1`
**From:** `noreply@nexacreators.com.br`

**Uso:**
- Verificação de email
- Notificações
- Recuperação de senha

---

## 🌍 Variáveis de Ambiente - Produção

### Backend (Cloud Run)

```env
# App
APP_ENV=production
APP_DEBUG=false
APP_URL=https://nexa-backend2-1044548850970.southamerica-east1.run.app
APP_KEY=base64:***

# Database (Supabase)
DB_CONNECTION=pgsql
DB_HOST=db.iuyapitbtdeoktaeqjai.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=***

# Storage (GCP)
GOOGLE_CLOUD_PROJECT_ID=nexa-teste-1
GOOGLE_CLOUD_STORAGE_BUCKET=nexa-uploads-prod
FILESYSTEM_DISK=gcs

# Cache (Upstash Redis)
CACHE_DRIVER=file
REDIS_CLIENT=predis
REDIS_HOST=grand-mastiff-18934.upstash.io
REDIS_PORT=6379
REDIS_SCHEME=tls
REDIS_PASSWORD=***

# Email (AWS SES)
MAIL_MAILER=ses
MAIL_FROM_ADDRESS=noreply@nexacreators.com.br
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
AWS_DEFAULT_REGION=sa-east-1

# WebSocket (Reverb)
BROADCAST_DRIVER=reverb
REVERB_HOST=nexa-chat-bwld7w5onq-rj.a.run.app
REVERB_PORT=443
REVERB_SCHEME=https

# Stripe
STRIPE_SECRET_KEY=sk_test_***
STRIPE_PUBLISHABLE_KEY=pk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***

# Frontend
FRONTEND_URL=https://nexacreators.com.br
SANCTUM_STATEFUL_DOMAINS=nexa-frontend-1044548850970.southamerica-east1.run.app
```

---

## 🚀 Deploy

### Backend
```bash
# Build e deploy via Cloud Build
gcloud builds submit --config cloudbuild.prod.yaml
```

### Frontend
```bash
# Build e deploy via Cloud Build
gcloud builds submit --config cloudbuild.prod.yaml
```

---

## 📁 Buckets GCP

| Nome | Uso | Região |
|------|-----|--------|
| `nexa-uploads-prod` | Arquivos de usuários | southamerica-east1 |
| `nexa-teste-1_cloudbuild` | Artefatos de build | US |
| `run-sources-nexa-teste-1-*` | Source code do Cloud Run | southamerica-east1 |

---

## 🔐 Segurança

- **SSL/TLS:** Todos os endpoints usam HTTPS
- **CORS:** Configurado para aceitar apenas domínios autorizados
- **Auth:** Laravel Sanctum com tokens
- **Database:** Conexão SSL com Supabase

---

## 📞 Suporte e Dashboards

| Serviço | Dashboard |
|---------|-----------|
| GCP Console | https://console.cloud.google.com/run?project=nexa-teste-1 |
| Supabase | https://supabase.com/dashboard/project/iuyapitbtdeoktaeqjai |
| Upstash | https://console.upstash.com/ |
| AWS Console | https://console.aws.amazon.com/ |

---

## 📝 Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 02/01/2026 | Migração do Cloud SQL para Supabase (economia de ~$9/mês) |
| 02/01/2026 | Remoção de VM não utilizada (economia de ~$1.50/mês) |
| 02/01/2026 | Otimização do Cloud Run (max-instances=2) |
| 02/01/2026 | Limpeza de buckets de build |

---

## 💡 Próximos Passos para Escalar

1. **Se exceder 500MB no Supabase:** Upgrade para Pro ($25/mês) ou migrar para Cloud SQL
2. **Se exceder 5GB no Storage:** Pagamento por uso (~$0.02/GB)
3. **Se precisar de mais performance:** Aumentar min-instances para 1 (evita cold start)
4. **Se precisar de CDN:** Configurar Cloud CDN no bucket de storage
