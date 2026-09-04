import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, "../../../data")

export async function loadSeedData() {
  const files = await fs.readdir(DATA_DIR)
  const data = {}
  for (const file of files) {
    if (!file.endsWith(".json")) continue
    const name = file.replace(".json", "")
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8")
    data[name] = JSON.parse(raw)
  }
  return data
}
