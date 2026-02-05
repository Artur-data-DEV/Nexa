# Backend — Variáveis de Ambiente em Produção (Cloud Run)

Este guia descreve como configurar variáveis de ambiente sensíveis para o backend no Google Cloud Run usando Cloud Build (substituições) de forma segura.

## Serviço
- Serviço: `nexa-backend-prod`
- Região: `southamerica-east1`

## Passo 1 — Substituições no Cloud Build
Configure as substituições no Trigger do Cloud Build (UI do Google Cloud):

- `_APP_URL` — ex: `https://www.nexacreators.com`
- `_FRONTEND_URL` — ex: `https://www.nexacreators.com`
- `_SANCTUM_STATEFUL_DOMAINS` — ex: `nexacreators.com,www.nexacreators.com`
- `_SESSION_DOMAIN` — ex: `nexacreators.com`
- `_STRIPE_SECRET_KEY` — sua chave secreta Stripe
- `_STRIPE_PUBLISHABLE_KEY` — sua chave pública Stripe
- `_STRIPE_WEBHOOK_SECRET` — webhook secret Stripe (opcional, recomendado)
- `_MAIL_FROM_ADDRESS` — ex: `no-reply@nexacreators.com`
- `_MAIL_FROM_NAME` — ex: `Nexa`
- `_AWS_ACCESS_KEY_ID` — chave AWS
- `_AWS_SECRET_ACCESS_KEY` — segredo AWS
- `_DATABASE_URL` — URL completa (opcional)
- `_DB_HOST` — host do banco (se não usar `DATABASE_URL`)
- `_DB_PORT` — porta do banco
- `_DB_DATABASE` — nome do database
- `_DB_USERNAME` — usuário
- `_DB_PASSWORD` — senha

O arquivo [cloudbuild.prod.yaml](file:///c:/Users/artur/Documents/GitHub/Nexa/backend/cloudbuild.prod.yaml) já está preparado para consumir essas variáveis via `--set-env-vars`.

## Passo 2 — Deploy
Ao disparar o trigger do Cloud Build, as variáveis serão aplicadas no serviço Cloud Run. O script de inicialização [start.sh](file:///c:/Users/artur/Documents/GitHub/Nexa/backend/start.sh) injeta automaticamente essas variáveis no `.env` da aplicação.

## Observações
- Nunca commit de segredos no repositório.
- Use substituições do Cloud Build ou Secret Manager para gerenciar credenciais.
- `DB_SSLMODE=require` está forçado para produção.

