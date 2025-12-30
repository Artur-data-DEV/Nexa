# Nexa Platform

Plataforma de conexão entre **Criadores de Conteúdo** e **Marcas** para campanhas de marketing de influência.

## 🏗️ Arquitetura

```
Nexa/
├── backend/          # Laravel 10 (PHP 8.4)
├── frontend/         # Next.js 16 (React 19)
├── docs/             # Documentação histórica
├── infra/            # Configurações de infraestrutura
└── monitoring/       # Configurações de monitoramento
```

## 🚀 Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Backend | Laravel 10 · PHP 8.4 |
| Frontend | Next.js 16 · React 19 · TypeScript |
| Realtime | Laravel Reverb (WebSockets) |
| Banco de Dados | PostgreSQL |
| Cache/Queue | Redis |
| Pagamentos | Stripe Connect |
| Infraestrutura | Google Cloud Run |

## 📁 Documentação

| Documento | Descrição |
|-----------|-----------|
| [RELATORIO_ENTREGA_FINAL.md](./RELATORIO_ENTREGA_FINAL.md) | Relatório de entrega técnica |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guia de deploy em produção |
| [docs/](./docs/) | Changelogs e documentação histórica |

## 🔧 Desenvolvimento Local

### Pré-requisitos
- Docker & Docker Compose
- Node.js 20+
- PHP 8.4
- Composer

### Executar o projeto
```bash
# Subir todos os serviços
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# WebSocket: ws://localhost:8080
```

## 🌐 Ambiente de Produção

| Serviço | URL |
|---------|-----|
| Frontend | https://nexa-frontend-1044548850970.southamerica-east1.run.app |
| Backend | https://nexa-backend2-1044548850970.southamerica-east1.run.app |

## 📞 Suporte

Para questões técnicas, entre em contato com a equipe de desenvolvimento.

---

*Desenvolvido por Artur Campos · 2025*
