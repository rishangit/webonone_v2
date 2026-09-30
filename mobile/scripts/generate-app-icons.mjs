/**
 * Builds mobile launcher assets: white background + centered black WebOnOne mark.
 * Run: npm run generate-icons -w @webonone/mobile
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(__dirname, '..', 'assets')
const logoSvgPath = join(__dirname, '..', '..', 'ui-kit', 'package', 'src', 'assets', 'webonone-logo.svg')

const SIZE = 1024
/** Logo width as a fraction of the canvas (fits Android adaptive-icon safe zone). */
const LOGO_WIDTH_RATIO = 0.54
const MARK_WIDTH = 160
const MARK_HEIGHT = 139
const MARK_CENTER_X = MARK_WIDTH / 2
const MARK_CENTER_Y = MARK_HEIGHT / 2
const LOGO_FILL = '#171717'
const BACKGROUND = '#ffffff'

function extractLogoPath(svgSource) {
  const match = svgSource.match(/<path[^>]*\sd="([^"]+)"/)
  if (!match) {
    throw new Error(`Could not read logo path from ${logoSvgPath}`)
  }
  return match[1]
}

function buildCanvasSvg({ includeBackground }) {
  const pathD = extractLogoPath(readFileSync(logoSvgPath, 'utf8'))
  const scale = (SIZE * LOGO_WIDTH_RATIO) / MARK_WIDTH
  const backgroundRect = includeBackground
    ? `<rect width="${SIZE}" height="${SIZE}" fill="${BACKGROUND}"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${backgroundRect}
  <g transform="translate(${SIZE / 2} ${SIZE / 2}) scale(${scale}) translate(${-MARK_CENTER_X} ${-MARK_CENTER_Y})">
    <path fill="${LOGO_FILL}" fill-rule="evenodd" d="${pathD}"/>
  </g>
</svg>`
}

async function writePng(filename, svg) {
  const outPath = join(assetsDir, filename)
  await sharp(Buffer.from(svg)).png().toFile(outPath)
  const meta = await sharp(outPath).metadata()
  console.log(`Wrote ${filename} (${meta.width}×${meta.height})`)
}

await writePng('icon.png', buildCanvasSvg({ includeBackground: true }))
await writePng('adaptive-icon.png', buildCanvasSvg({ includeBackground: false }))
