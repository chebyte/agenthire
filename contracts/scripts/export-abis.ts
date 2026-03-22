import fs from "fs"
import path from "path"

const ARTIFACTS_DIR = path.join(__dirname, "../artifacts/contracts")
const OUTPUT_DIR = path.join(__dirname, "../../src/lib/contracts/abis")

const contracts = ["MockUSDC", "AgentRegistry", "JobManager"]

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const name of contracts) {
    const artifactPath = path.join(ARTIFACTS_DIR, `${name}.sol`, `${name}.json`)
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"))
    const outputPath = path.join(OUTPUT_DIR, `${name}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2))
    console.log(`Exported ${name} ABI to ${outputPath}`)
  }
}

main()
