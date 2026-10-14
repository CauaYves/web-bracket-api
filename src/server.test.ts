import { spawn } from "node:child_process"
import { once } from "node:events"
import { expect, test } from "vitest"

test("GET /health responde ok e o processo encerra com SIGTERM", async () => {
  const child = spawn(process.execPath, ["src/server.ts"], {
    env: { ...process.env, PORT: "4101", HOST: "127.0.0.1" },
  })
  await once(child.stdout, "data") // espera "API ouvindo..."

  const res = await fetch("http://127.0.0.1:4101/health")
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ status: "ok" })

  child.kill("SIGTERM")
  await once(child, "exit")
})
