# Migração do Frontend para Next.js

## Visão Geral
Objetivo: migrar o frontend atual (Vite + React + Bun) para Next.js (App Router, TypeScript), mantendo a API em Laravel. Ganhos esperados: SEO/SSR para páginas públicas, roteamento file-based, melhor performance e DX, sem perder integrações em tempo real com Laravel Echo/Reverb.

## Feasibilidade
- Bibliotecas atuais são compatíveis com Next.js: `react`, `redux`, `@reduxjs/toolkit`, `react-hook-form`, `zod`, `sonner`, `lucide-react`, `@radix-ui/*`, `laravel-echo`, `pusher-js`.
- WebSocket (Reverb) permanece client-side; não há dependência de APIs Next internas.
- Substituição de `react-helmet-async` por `metadata` do Next nas páginas públicas.
- `import.meta.env.*` migra para `process.env.NEXT_PUBLIC_*` com arquivo `.env` do Next.
- Rotas atuais em `react-router-dom` migram para file-based routes (`app/*`) com layouts e nested routes. Exemplos:
  - `/signup/creator` → `app/signup/creator/page.tsx`
  - `/brand/chat` → `app/brand/chat/page.tsx`

## Escopo Inicial
1. Adotar App Router (Next 14+) com TypeScript.
2. Manter Redux store e persistência existentes.
3. Portar ThemeProvider, componentes UI e estilos.
4. Portar páginas públicas (landing, auth) com SSR/SEO.
5. Portar páginas autenticadas sensíveis a tempo real (Chat) como Client Components.

## Decisões Técnicas
- Router: App Router (`app/`) com `layout.tsx` e `page.tsx`; uso de Client Components onde há Echo/Reverb.
- Estado global: manter Redux; configurar `Providers` no `app/providers.tsx`.
- UI: manter Radix + shadcn; compatível com Next.
- SEO: usar `export const metadata = { ... }` nas páginas com SEO; remover `react-helmet-async`.
- Env: mapear `VITE_*` para `NEXT_PUBLIC_*`. Exemplo:
  - `VITE_BACKEND_URL` → `NEXT_PUBLIC_BACKEND_URL`
  - `VITE_REVERB_*` → `NEXT_PUBLIC_REVERB_*`
- Build: continuar com Bun (`bun dev` / `bun start`) ou `npm`. Docker: adicionar serviço `frontend_next` em `docker-compose.yml`.

## Integrações
- Auth:
  - Fluxo atual permanece contra Laravel (Sanctum/JWT) via chamadas HTTP.
  - Google OAuth: botão e redirect seguem a mesma URL do backend; Next substitui páginas/clientes.
- Echo/Reverb:
  - Reutilizar `useSocket` adaptado para Next (Client Component).
  - Channels privados continuam com backend broadcast-auth (sanctum).
- Uploads:
  - Mantém `fetch`/FormData para `sendMessage` no backend; Next não precisa API Route.

## Migração por Fases
1. Fundações
  - Criar app Next (`app/`, `pages` se necessário), `tsconfig`, `eslint`, `next.config.js`.
  - Configurar `Providers` (Theme, Redux, Toast).
  - Variáveis de ambiente mapeadas (`NEXT_PUBLIC_*`).
2. Páginas Públicas (SSR)
  - Landing, login/signup (sem tempo real).
  - Substituir `Helmet`/`react-helmet-async` por `metadata`.
3. Páginas Autenticadas (CSR)
  - Chat (Client Components) com Echo, upload, typing e deduplicação.
  - Dashboard marca/criador.
4. Integrações Complementares
  - Google OAuth (redirecionamento e callback).
  - Contratos/ofertas (hiring API) e páginas relacionadas.
5. Hardening
  - Testes (Vitest/Playwright), auditoria de performance, acessibilidade, logs.
6. Docker/Deploy
  - Adicionar serviço Next ao `docker-compose.yml` e pipelines.

## Mapeamento de Rotas (Exemplos)
- `Nexa_FrontEnd/src/pages/auth/CreatorSignUp.tsx` → `app/signup/creator/page.tsx` (Client Component; mantém validações e `intl-tel-input`)
- `src/components/Chat.tsx` e `src/pages/brand/ChatPage.tsx` → `app/chat/page.tsx` ou `app/brand/chat/page.tsx` (Client Component; integra Echo/Reverb)
- `react-helmet-async` → `metadata` e `link rel="canonical"` via `metadata.alternates`

## Adaptações de Código
- Env:
  - Antes: `import.meta.env.VITE_BACKEND_URL`
  - Depois: `process.env.NEXT_PUBLIC_BACKEND_URL`
- Helmet:
  - Antes: `<Helmet>...`
  - Depois: `export const metadata = { title, description, alternates: { canonical } }`
- Navegação:
  - Antes: `useNavigate()`/`Link` do `react-router-dom`
  - Depois: `next/navigation` (`useRouter().push`) e `<Link href="/...">`

## Riscos e Mitigações
- SSR e dependências de `window`:
  - Usar Client Components onde há acesso ao `window` (Echo, VisualViewport, localStorage).
- Rotas privadas:
  - Implementar guardas via Client Components e checagens de auth; optionally Middleware (Next) para redirecionar não autenticados.
- Upload via API Laravel:
  - Manter endpoints; validar CORS.
- SEO:
  - Conferir metas e canônicos; migrar dados estruturados para `metadata`/`next/script`.

## Entregáveis Iniciais
- Skeleton de projeto Next com Providers e env.
- Páginas de auth (signin/signup) portadas e funcionais contra Laravel.
- PoC do Chat em Next (client-side), validando Echo/Reverb e upload.
- Guia de mapeamento de env e roteamento para equipe.

## Próximos Passos
- Se aprovado, inicializo o esqueleto Next na pasta `Nexa_FrontEnd_Next`, configuro Providers, env e porto `CreatorSignUp` + uma página do Chat como prova de conceito.
   