# Changelog - 2025-12-15

## Resumo
Consolidação de melhorias no chat em tempo real (frontend e backend), inclusão de mensagens-guia automáticas, upload de arquivos com pré-visualização e validações, fluxo completo de ofertas/contratos e testes de cadastro de criadores. Ambiente Docker/Reverb organizado para desenvolvimento local com Redis e PostgreSQL.

## Backend
- `app/Http/Controllers/ChatController.php`:
  - Lista de salas com contagem de não lidas e último evento.
  - Recuperação de mensagens com marcação automática como lidas.
  - Enriquecimento de `offer_data` com estado atual da oferta/contrato.
  - Envio de mensagens com anexos (imagem/arquivo) e metadados.
  - Eventos Reverb: `NewMessage`, `MessagesRead`.
  - Mensagens-guia automáticas para criador/marca ao iniciar a conversa.
  - Criação automática de oferta inicial com base na campanha ativa.
- `app/Http/Controllers/ContractController.php`:
  - Listagem, detalhamento e paginação de contratos por sala.
  - Ativação, finalização, cancelamento, término e disputa de contrato.
  - Mensagem sistêmica de conclusão com instrução de avaliação do trabalho.
  - Broadcast de eventos: `ContractActivated`, `ContractCompleted`, `ContractTerminated`.
- `app/Http/Requests/Auth/LoginRequest.php`:
  - Rate limit com chave por `email|ip` e logs de bloqueio.
  - Fluxo de conta removida/restaurável até 30 dias.
  - Mensagens de validação específicas para e-mail, senha e verificação.
- `config/database.php`:
  - Configurações consistentes para `sqlite`, `mysql`, `pgsql`, `sqlsrv` e Redis.

## Frontend
- `src/components/Chat.tsx`:
  - Inserção de mensagens-guia estruturadas (uma vez por sala, com `localStorage`).
  - Viewer de imagens com zoom, rotação, reset e download com múltiplos fallbacks.
  - Upload com limite (10MB), tipos permitidos amplos e UI otimista com progresso.
  - Deduplicação de mensagens, marcação de lidas e indicadores de digitação.
  - Integração com ofertas e contratos (aceitar/rejeitar/cancelar/finalizar/avaliar).
- `src/pages/brand/ChatPage.tsx`:
  - Fluxo completo de ofertas (criação, aceite, rejeição, cancelamento) e associação robusta `offer_id`.
  - Paginação de mensagens com “Carregar anteriores”.
  - Término de contrato pela marca com motivo e atualização de estado em tempo real.
  - UI aprimorada para anexos, preview de imagem, dropdown de ações e toasts.
- `src/pages/auth/CreatorSignUp.tsx`:
  - Cadastro em 2 passos com validações e form dinâmico.
  - Integração `intl-tel-input`, normalização E.164 e fallback BR progressivo.
  - Rotas pós-registro: verificação de aluno, assinatura ou dashboard por papel.
  - Tratamento robusto de erros (422, 429, timeout, rede e servidor).

## Testes
- `src/pages/auth/__tests__/CreatorSignUp.test.tsx`:
  - Renderização e acessibilidade de campos.
  - Interações: preenchimento, passo a passo e alternância de aluno.
  - Validações: nome, e-mail, senha fraca e confirmação divergente.
  - Submissão: navegação para verificação de aluno e dashboard criador.
  - Alternância entre “Registrar” e “Entrar”, links e navegação por logo.

## Ambiente e DevOps
- `docker-compose.yml`:
  - Serviços locais: `db` (PostgreSQL), `redis`, `backend` (artisan serve), `chat` (Reverb), `frontend` (bun dev), `cadvisor`, `prometheus`, `portainer`.
  - Variáveis para Redis, Reverb, URLs locais e sincronização de volumes.
- `Nexa_BackEnd/.env`:
  - Ajustes para URLs locais e Reverb (sem expor segredos).
- `Nexa_BackEnd/phpunit.xml`:
  - Atualizações para execução consistente de testes no ambiente local.

## Observações
- Mensagens marcadas como lidas imediatamente após recebidas quando aplicável.
- Prevenção de duplicidade de mensagens via `Set` e filtragem.
- UI responsiva e com acessibilidade (labels, roles e feedback visual).
- Integração consistente com Reverb/Laravel Echo em tempo real.

## Arquivos Impactados (principais)
- Backend: `app/Http/Controllers/ChatController.php`, `app/Http/Controllers/ContractController.php`, `app/Http/Requests/Auth/LoginRequest.php`, `config/database.php`, `.env`, `docker-compose.yml`.
- Frontend: `src/components/Chat.tsx`, `src/pages/brand/ChatPage.tsx`, `src/pages/auth/CreatorSignUp.tsx`, `src/pages/auth/__tests__/CreatorSignUp.test.tsx`.
