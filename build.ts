#!/usr/bin/env bun
import { build, type BuildConfig } from "bun"
import plugin from "bun-plugin-tailwind"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import path from "node:path"

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: bun run build.ts [options]

Common Options:
  --outdir <path>      Output directory (default: "dist")
  --minify             Enable minification
  --source-map <type>  Sourcemap type: none|linked|inline|external
  --splitting          Enable code splitting
  --help, -h           Show this help message
`)
  process.exit(0)
}

const toCamelCase = (value: string) => value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())

const parseValue = (value: string): unknown => {
  if (value === "true") return true
  if (value === "false") return false
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10)
  if (/^\d*\.\d+$/.test(value)) return Number.parseFloat(value)
  if (value.includes(",")) return value.split(",").map(entry => entry.trim())
  return value
}

function parseArgs(): Partial<BuildConfig> {
  const config: Record<string, unknown> = {}
  const args = process.argv.slice(2)

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith("--")) continue

    if (arg.startsWith("--no-")) {
      config[toCamelCase(arg.slice(5))] = false
      continue
    }

    if (!arg.includes("=") && (index === args.length - 1 || args[index + 1].startsWith("--"))) {
      config[toCamelCase(arg.slice(2))] = true
      continue
    }

    let key: string
    let value: string

    if (arg.includes("=")) {
      ;[key, value] = arg.slice(2).split("=", 2)
    } else {
      key = arg.slice(2)
      value = args[index + 1]
      index += 1
    }

    key = toCamelCase(key)

    if (key.includes(".")) {
      const [parentKey, childKey] = key.split(".")
      const currentParent = (config[parentKey] as Record<string, unknown> | undefined) ?? {}
      currentParent[childKey] = parseValue(value)
      config[parentKey] = currentParent
      continue
    }

    config[key] = parseValue(value)
  }

  return config as Partial<BuildConfig>
}

const formatFileSize = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const cliConfig = parseArgs()
const outdir = typeof cliConfig.outdir === "string" ? cliConfig.outdir : path.join(process.cwd(), "dist")

if (existsSync(outdir)) {
  await rm(outdir, { recursive: true, force: true })
}

const entrypoints = [...new Bun.Glob("**/*.html").scanSync("src")]
  .map(file => path.resolve("src", file))
  .filter(file => !file.includes("node_modules"))

const result = await build({
  entrypoints,
  outdir,
  plugins: [plugin],
  target: "browser",
  minify: true,
  sourcemap: "linked",
  env: "BUN_PUBLIC_*",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  ...cliConfig,
})

console.table(
  result.outputs.map(output => ({
    File: path.relative(process.cwd(), output.path),
    Type: output.kind,
    Size: formatFileSize(output.size),
  })),
)
