# Guia de Testes e Qualidade - Nexa

Este documento descreve a estratégia de testes, como executá-los e como garantir a qualidade do código para o projeto Nexa.

## 1. Visão Geral

O projeto utiliza uma estratégia de testes em duas camadas principais:
- **Backend (Laravel):** Testes de Integração e Unidade com PHPUnit.
- **Frontend (Next.js):** Testes End-to-End (E2E) com Playwright.

## 2. Executando Testes do Frontend (Playwright)

Os testes E2E cobrem os fluxos críticos do usuário: Autenticação, Chat, Gestão de Campanhas e Pagamentos.

### Pré-requisitos
Certifique-se de estar na pasta `frontend`:
```bash
cd frontend
npm install
npx playwright install chromium
```

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run test:e2e` | Executa todos os testes em modo headless (sem interface). |
| `npm run test:e2e:ui` | Abre a interface interativa do Playwright para depuração. |
| `npm run test:e2e:report` | Gera e abre o relatório HTML dos testes executados. |

### Estrutura dos Testes
Os testes estão localizados em `frontend/e2e/flows`:
- `authentication.spec.ts`: Login, Cadastro, OTP e Rotas Protegidas.
- `chat.spec.ts`: Envio de mensagens, Websocket, Upload de arquivos.
- `campaign-crud.spec.ts`: Criação e gestão de campanhas.
- `payment.spec.ts`: Fluxos de pagamento com Stripe (Mock).

### Acessibilidade
Os testes incluem verificações automáticas de acessibilidade utilizando `axe-core`.

## 3. Executando Testes do Backend (PHPUnit)

Os testes do backend validam a lógica de negócios, regras de acesso e integrações.

### Comandos
Dentro da pasta `backend`:
```bash
php artisan test
```

## 4. Configurações Especiais

### Mocking
Para garantir estabilidade e velocidade, os testes de Frontend utilizam **Mocks** para chamadas de API externas (Stripe) e, em alguns casos, para o próprio Backend, permitindo testar a UI isoladamente.

### Variáveis de Ambiente
Certifique-se de que o arquivo `.env` (ou `.env.test`) esteja configurado corretamente com as chaves de API necessárias (mesmo que mockadas, a aplicação pode exigir a presença das chaves).

## 5. Critérios de Aceite (UAT)
Conforme o Anexo III do contrato, a aceitação depende de:
1.  Ausência de bugs críticos.
2.  Passagem bem-sucedida nos fluxos automatizados acima.
3.  Validação funcional das entregas (OTP, Chat, Containerização).
