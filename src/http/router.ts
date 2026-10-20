import type { IncomingMessage, ServerResponse } from "node:http"

function GET(_req: IncomingMessage, res: ServerResponse) {
  console.log("chamou GET")
  res.writeHead(200, { "content-type": "application/json" })
  return res.end(JSON.stringify({ message: "Deu certo!" }))
}

function POST(req: IncomingMessage, res: ServerResponse) {
  console.log("chamou POST")
  let body = ""

  req.on("data", (chunk) => {
    console.log(chunk)
    body += chunk
  })
  req.on("end", () => {
    res.writeHead(200, { "content-type": "application/json" })
    res.write(JSON.stringify({ message: `Recebemos esse corpo: ${body}` }))
  })

  return res.end()
}

export { GET, POST }
