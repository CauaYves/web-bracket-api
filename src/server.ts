import { createServer } from "node:http"
import { GET, POST } from "./http/router.ts"

const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? "127.0.0.1"

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ status: "ok" }))
    return
  }

  if (req.method === "GET" && req.url === "/http") {
    return GET(req, res)
  }

  if (req.method === "POST" && req.url === "/http") {
    return POST(req, res)
  }
  res.writeHead(404, { "content-type": "application/json" })
  res.end(JSON.stringify({ code: "not_found" }))
})

server.listen(port, host, () => {
  console.log(`API ouvindo em http://${host}:${port}`)
})

// Shutdown limpo: para de aceitar conexões novas e deixa as atuais terminarem.
function shutdown(signal: string) {
  console.log(`${signal} recebido, encerrando...`)
  server.close(() => process.exit(0))
  server.closeIdleConnections()
}
process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
