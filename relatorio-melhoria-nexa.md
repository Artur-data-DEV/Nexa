# Relatório de Diagnóstico e Plano de Ação Técnica - Nexa

## 1. Diagnóstico Técnico ("O Estado Atual")

Após auditoria detalhada no código (Backend Laravel e Frontend React), identificamos problemas estruturais críticos que justificam a instabilidade e dificuldade de manutenção atual.

### 1.1. Arquitetura de Chat Frágil (Ponto Crítico)
- **Problema:** A implementação atual é híbrida e desconexa. O Backend (`ChatController.php`) opera como uma API REST tradicional (banco de dados), enquanto o Frontend (`useSocket.ts`) tenta manter uma conexão em tempo real separada.
- **Evidência:** O controller faz log excessivo (`\Log::info`) e opera com polling/requisições HTTP para ler mensagens, ignorando o poder de broadcasting do Laravel.
- **Consequência:** Mensagens perdidas, atraso na entrega, duplicidade de lógica e alta carga no banco de dados (problema N+1 detectado na listagem de salas).

### 1.2. Falhas de Segurança e Boas Práticas
- **Rotas de Debug em Produção:** O arquivo `api.php` expõe rotas como `/payment/debug` e `/payment/test` publicamente. Isso é um risco grave de segurança.
- **Falta de Validação Robusta:** Muitos endpoints usam `Request $request` diretamente sem classes de validação (`FormRequest`), permitindo entrada de dados sujos no sistema.
- **Logs Excessivos:** O código está poluição com logs de debug que deveriam ser removidos, sujando o monitoramento real.

### 1.3. Estrutura de Código (Dívida Técnica)
- **Backend:** Estrutura "flat" (todos controllers na raiz ou pastas misturadas), dificultando saber onde está a regra de negócio. Lógica de filtragem de usuário (Brand vs Creator) misturada dentro dos Controllers.
- **Frontend:** O componente `ChatPage.tsx` é monolítico (gigante), misturando UI, lógica de upload, regras de negócio e gerenciamento de estado.

---

## 2. Plano de Ação - 30 Dias (Foco em Estabilidade e Chat)

**Objetivo:** Transformar o chat em um sistema robusto (Realtime nativo), fechar brechas de segurança e profissionalizar o deploy.

### Semana 1: Segurança e "Estancar a Sangria" (Dias 1-7)
- **Limpeza de Rotas:** Remover rotas de teste/debug (`/payment/debug`, etc.) e proteger endpoints sensíveis.
- **Padronização de Validação:** Criar `FormRequest` para as rotas críticas (Login, Cadastro, Envio de Mensagem) para garantir integridade dos dados.
- **Ambiente:** Configurar `.env` seguro e remover logs de debug (`\Log::info`) do código de produção.
- **Correção N+1:** Otimizar a query de listagem de chats (`ChatController::getChatRooms`) para não matar o banco de dados com muitos usuários.

### Semana 2: Refatoração do Backend do Chat (Dias 8-14)
- **Implementar Laravel Broadcasting:** Abandonar a solução customizada de socket atual. Configurar **Laravel Reverb** (ou Pusher) para gerenciar WebSockets nativamente.
- **Eventos:** Criar eventos `MessageSent` e `OfferCreated` que implementam `ShouldBroadcast`. O Laravel cuidará de enviar isso para o socket automaticamente.
- **Limpeza do Controller:** Mover lógica de "Quem é o usuário" (Brand/Creator) para um Service ou Policy, deixando o `ChatController` limpo.

### Semana 3: Refatoração do Frontend e Integração (Dias 15-21)
- **Migrar para Laravel Echo:** Substituir o hook `useSocket` atual pelo cliente oficial **Laravel Echo**. Isso garante compatibilidade total com o backend refatorado.
- **Componentização:** Quebrar `ChatPage.tsx` em componentes menores (`ChatSidebar`, `ChatWindow`, `MessageInput`) para facilitar manutenção.
- **Feedback Visual:** Implementar indicadores reais de "Enviando", "Lido" e "Digitando" usando os eventos do Echo (Whisper).

### Semana 4: Deploy Profissional e Entrega (Dias 22-30)
- **Estratégia de Deploy Vercel:** Configurar o Frontend para deploy automático na Vercel (melhor CDN e performance).
- **Deploy Backend:** Configurar o Backend em ambiente compatível (Railway, DigitalOcean ou manter atual com CI/CD melhorado).
- **Testes de Carga:** Simular conversas reais para garantir que o novo sistema de WebSocket aguenta o tranco.
- **Entrega Final:** Documentação técnica atualizada e sistema estável.

---

## 3. Investimento e Entregáveis

**Estimativa de Esforço:** ~80 a 100 horas técnicas.
**Valor Sugerido:** R$ 12.000,00 (Pacote Fechado Mensal).

**Entregáveis Concretos:**
1.  Sistema de Chat em Tempo Real (Nativo Laravel/Echo) - *Estável e Rápido*.
2.  Relatório de Segurança (Rotas fechadas e validações aplicadas).
3.  Pipeline de Deploy Automatizado (Frontend na Vercel).
4.  Código Refatorado (Backend e Frontend) pronto para escalar.

---

*Este plano foca em resolver a dor principal (Chat e Instabilidade) enquanto paga a dívida técnica que impede o projeto de crescer.*
