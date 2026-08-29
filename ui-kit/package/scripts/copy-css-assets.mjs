import { cpSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(packageRoot, 'src/styles/assets')
const target = path.join(packageRoot, 'dist/assets')

mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true })
