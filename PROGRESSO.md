# Progresso do aprendizado — web-bracket-api

Diário das sessões de mentoria. Complementa o `CHECKLIST.md` (o que fazer) com o
que já foi entendido, o que está em andamento e onde retomar.

## Regras da mentoria (para qualquer agente que continuar)

- **Não escrever código pelo aluno.** O objetivo é aprender Node. Explicar
  conceitos, apontar onde está o problema, fazer perguntas-guia e indicar o que
  pesquisar na documentação. Revisar quando ele pedir.
- Mostrar comandos de ferramenta para ele rodar (curl, etc.) é permitido.
- Responder em português.
- Explicações que funcionaram bem: linha do tempo do que roda agora e do que roda
  depois, analogias curtas e tabelas evento → significado → tarefa.

## Ambiente do aluno

- Windows, Node 24, pnpm (existe um `package-lock.json` não rastreado, que
  provavelmente veio de um `npm install` por engano).
- Testa no **Windows PowerShell 5.1** (prompt `PS C:\WINDOWS\system32>`), que
  **remove as aspas duplas internas** dos argumentos passados ao `curl.exe`.
  `-d '{"name": "Yves"}'` chega ao servidor como `{name: Yves}`. Já foi avisado;
  as saídas são usar `pwsh` 7.3+, `-d "@arquivo.json"` ou `--json`.

## Sessão 1 — 2026-10-19/20: testando HTTP e lendo o body da requisição

### Conceitos discutidos (entendidos ou em consolidação)

1. **Testar HTTP de forma profissional**
   - Manual: `curl.exe -i` (no PowerShell sempre com `.exe`), arquivo `.http`
     versionado (REST Client) e Bruno/Insomnia. O aluno escolheu o curl.
   - Automatizado, a ser feito depois: separar `createApp()` (cria o servidor) de
     `listen()`, subir na porta `0` dentro do teste e usar o `fetch` nativo, sem
     precisar de supertest. O `server.test.ts` atual usa `spawn` numa porta fixa
     (4101), o que só faz sentido para o teste de shutdown.
   - Pirâmide: unidade (`body.ts` com `Readable.from([...chunks])` para controlar
     onde cada chunk termina), integração (rotas via `fetch`) e E2E (shutdown).
   - Fronteiras de chunk **não** são testáveis de forma confiável via HTTP, porque
     o TCP pode juntar pedaços.
2. **`IncomingMessage` é um stream**: o body chega em pedaços, depois que o
   handler já começou a rodar.
   - `data` entrega cada chunk. `end` só avisa que acabou e **não traz dados**.
   - O aluno achava que o `end` entregaria o body inteiro. Foi explicado que o
     Node não acumula o body de propósito (memória, uploads grandes, limite de
     1 MB → 413).
3. **`req.on(...)` só registra o callback** e não espera nada. O código síncrono
   do handler termina antes de qualquer chunk ser processado (event loop).
   Precisou de uma segunda explicação com linha do tempo e analogia (a pizza);
   ponto ainda em consolidação.
4. **`Buffer` = bytes** (o `console.log` mostra em hexadecimal). Texto é uma
   convenção (UTF-8) para interpretar bytes. Decodificamos
   `7b 6e 61 6d 65 ...` → `{name...`. A falta do byte `22` (a aspa) provou o
   problema do PowerShell.
5. **Armadilha UTF-8**: `body += chunk` converte cada Buffer separadamente e pode
   quebrar caracteres multibyte (`ã` = `c3 a3`). Foi sugerido pesquisar
   `Buffer.concat` ou `readable.setEncoding` e entender por que cada um resolve.
   **Ainda não implementado.**
6. `Transfer-Encoding: chunked` aparece porque ele usa `res.write()` antes do
   `end()` sem `content-length`. Isso não é erro.
7. `req.on("end")` (stream de entrada) e `res.end()` (encerrar a resposta) são
   coisas diferentes com nomes parecidos.

### Estado atual do código (`src/http/router.ts`, `POST`)

- Já usa `req.on("data")` para acumular e `req.on("end")` com `writeHead` e
  `write` dentro.
- **Bug pendente:** `res.end()` continua **fora** do listener de `end`, no corpo
  do handler. Ele roda imediatamente e envia uma resposta vazia. Quando o `end`
  do request dispara, o `writeHead` lança `ERR_HTTP_HEADERS_SENT`, e esse erro
  dentro do listener deve derrubar o processo. Ainda não foi discutido com o
  aluno; é o próximo ponto.
- `body += chunk` ainda tem o problema de UTF-8 (item 5).
- Os `console.log` de depuração ainda estão no código.

### Próximos passos sugeridos

1. Revisar o `POST`: levar o aluno a perceber que o `res.end()` também precisa ir
   para dentro do listener de `end`. Se ele testar, observar junto o crash
   `ERR_HTTP_HEADERS_SENT`, que liga com o item "`res.end()` nunca é chamado duas
   vezes" do checklist.
2. Testar com o JSON correto (pwsh ou arquivo) e com `"Cauã"`.
3. Corrigir a conversão de bytes para texto (item 5).
4. Seguir para a Etapa 1 do `CHECKLIST.md`: extrair a leitura do body para
   `src/http/body.ts` (JSON e limite de 1 MB → 413), depois a refatoração
   `createApp()` e os testes de integração com porta `0`.
