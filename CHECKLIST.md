# Checklist — web-bracket-api

Modo de trabalho: **eu escrevo o código, o Claude orienta e revisa.**
Regras de negócio: `E:\web-bracket\BUSINESS_RULES.md`.

## Etapa 0 — Setup ✅

- [x] Node 24 + pnpm 12.5
- [x] `package.json`, `tsconfig.json` (type stripping nativo)
- [x] Biome (`pnpm lint`, `pnpm format`)
- [x] Vitest (`pnpm test`) e `pnpm typecheck`
- [x] Servidor mínimo com `/health` e teste
- [x] `git init` + primeiro commit
- [x] Instalar Docker Desktop (`winget install Docker.DockerDesktop`) — necessário na etapa 2

## Etapa 1 — Servidor HTTP com `node:http`

Estudo
- [] `IncomingMessage` / `ServerResponse` como streams
- [x] Event loop: o que bloqueia e por quê
- [x] `server.close()` vs `closeIdleConnections()`
- [x] Por que `127.0.0.1` e não `0.0.0.0`

Implementação
- [ ] `src/http/router.ts`: `get`, `post`, `put`, `delete`
- [ ] Params de caminho (`/championships/:id`)
- [ ] `src/http/body.ts`: leitura de JSON via stream
- [ ] Limite de tamanho do body (1 MB) → `413`
- [ ] `src/http/errors.ts`: `AppError` com `code` estável
- [ ] Formato de erro `{ code, message?, fieldErrors? }`
- [ ] `404 not_found`
- [ ] `405 method_not_allowed` com header `Allow`
- [ ] `400 invalid_json`
- [ ] `500 internal_error` sem vazar stack (log no servidor)
- [ ] Log por requisição: método, caminho, status, duração, id (`crypto.randomUUID()`)
- [ ] Shutdown limpo no SIGTERM/SIGINT com timeout (10 s)
- [ ] Handler `async` que lança erro não vira *unhandled rejection*

Testes (Vitest)
- [ ] Rota com params
- [ ] 404, 405, 400, 413, 500
- [ ] Body com caractere UTF-8 multibyte em chunks
- [ ] Shutdown encerra o processo

Armadilhas a verificar
- [ ] `res.end()` nunca é chamado duas vezes
- [ ] Chunks quebrando no meio de um caractere UTF-8

## Etapa 2 — PostgreSQL

- [ ] `docker-compose.yml` com Postgres (versão fixa, volume, healthcheck)
- [ ] `.env` com `DATABASE_URL`
- [ ] Pool `pg` (tamanho, timeouts, encerramento no shutdown)
- [ ] Runner de migrations `.sql` numeradas (tabela `schema_migrations`)
- [ ] Schema portado do champ-bracket, **sem RLS** (profiles, presets, championships, divisions, registrations)
- [ ] Seed das modalidades nativas (§4)
- [ ] Helper de transação (`BEGIN`/`COMMIT`/`ROLLBACK`)
- [ ] Queries parametrizadas (nunca concatenar SQL)
- [ ] Teste de integração com banco

## Etapa 3 — Autenticação

- [ ] Cadastro: validação zod, senha ≥ 8
- [ ] Hash de senha com `scrypt` (salt, comparação com `timingSafeEqual`)
- [ ] Tabela `sessions`: token opaco, hash do token guardado, expiração
- [ ] Login com mensagem genérica ("E-mail ou senha incorretos.")
- [ ] Cookie `HttpOnly`, `SameSite`, `Secure` em produção
- [ ] Logout revoga a sessão
- [ ] Middleware que carrega o usuário da sessão
- [ ] Decidir: expiração/renovação e como o Next repassa o cookie
- [ ] Rate limit em login/cadastro

## Etapa 4 — Campeonatos e modalidades (CRUD)

- [ ] Presets: listar nativas + próprias, criar, editar, duplicar, excluir
- [ ] Campeonatos: criar (snapshot de `criteria`), listar, detalhar
- [ ] `public_slug` aleatório de 10 caracteres
- [ ] Toda query filtra por `owner_id`
- [ ] Transições manuais de status (§6.1)
- [ ] Definir `API_CONTRACT.md` (rotas, paginação, erros, versionamento)

## Etapa 5 — Inscrição, aprovação e divisões

- [ ] Endpoint público do campeonato por slug (só status ≠ `draft`)
- [ ] Inscrição pública com todas as regras do §7
- [ ] Dados do atleta imutáveis (trigger ou constraint)
- [ ] Aprovar/recusar inscrição
- [ ] Agrupamento automático e gerar divisões (§8)
- [ ] Criar, mover e excluir divisão
- [ ] Integridade da chave (§9): `athlete_in_drawn_bracket`, `division_bracket_drawn`, `bracket_has_invalid_athletes`
- [ ] Decidir: triggers no Postgres ou `SELECT ... FOR SHARE` na API
- [ ] Teste de concorrência (duas requisições simultâneas)
- [ ] `syncChampionshipStatus()` após cada mutação

## Etapa 6 — Motor de chaves e resultados

- [ ] Portar `bracket-engine` do champ-bracket (entendendo cada função)
- [ ] `seedOrder`, `createSingleElimination`
- [ ] `getMatches`, `recordWinner`, `clearResult` com cascata
- [ ] `getPlacements`, `isBracketComplete`
- [ ] Endpoints: sortear, descartar, trocar posições, iniciar lutas
- [ ] Endpoints: registrar vencedor e desfazer (com `confirmed`)
- [ ] Endpoints públicos das chaves (só nome e academia)
- [ ] Testes do motor (Vitest)

## Etapa 7 — Produção

- [ ] Logs estruturados (JSON)
- [ ] Variáveis de ambiente validadas na inicialização (zod)
- [ ] Headers de segurança
- [ ] Rate limit global
- [ ] `Dockerfile` da API (multi-stage, usuário não-root)
- [ ] Healthcheck e readiness (inclui o banco)
- [ ] Backups do Postgres
- [ ] Deploy e rede privada entre Next e API
- [ ] Teste de carga simples
- [ ] Revisão de segurança antes de abrir para usuários reais

## Aprendizado (Node a fundo)

- [ ] Event loop e fases
- [ ] Streams e backpressure
- [ ] `AsyncLocalStorage` (id de requisição nos logs)
- [ ] `worker_threads` / `child_process`: quando usar
- [ ] `node:test` vs Vitest
- [ ] Diagnóstico: `--inspect`, `--cpu-prof`, `perf_hooks`
- [ ] Tratamento de `uncaughtException` e `unhandledRejection`
