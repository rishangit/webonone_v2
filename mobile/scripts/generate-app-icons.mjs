/**
 * Builds mobile launcher + Android notification tray assets from ui-kit logo SVG.
 * Run: npm run generate-icons -w @webonone/mobile
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(__dirname, '..', 'assets')
const androidResDir = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res')
const logoSvgPath = join(__dirname, '..', '..', 'ui-kit', 'package', 'src', 'assets', 'webonone-logo.svg')

const SIZE = 1024
/** Logo width as a fraction of the canvas (fits Android adaptive-icon safe zone). */
const LOGO_WIDTH_RATIO = 0.54
const NOTIFICATION_LOGO_WIDTH_RATIO = 0.62
const MARK_WIDTH = 160
const MARK_HEIGHT = 139
const MARK_CENTER_X = MARK_WIDTH / 2
const MARK_CENTER_Y = MARK_HEIGHT / 2
const LOGO_FILL = '#171717'
const NOTIFICATION_FILL = '#FFFFFF'
const BACKGROUND = '#ffffff'

/** Android status-bar small icon densities (white silhouette on transparent). */
const ANDROID_NOTIFICATION_ICON_SIZES = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96,
}

function extractLogoPath(svgSource) {
  const match = svgSource.match(/<path[^>]*\sd="([^"]+)"/)
  if (!match) {
    throw new Error(`Could not read logo path from ${logoSvgPath}`)
  }
  return match[1]
}

function buildCanvasSvg({ includeBackground, fill, canvasSize, logoWidthRatio }) {
  const pathD = extractLogoPath(readFileSync(logoSvgPath, 'utf8'))
  const scale = (canvasSize * logoWidthRatio) / MARK_WIDTH
  const backgroundRect = includeBackground
    ? `<rect width="${canvasSize}" height="${canvasSize}" fill="${BACKGROUND}"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
  ${backgroundRect}
  <g transform="translate(${canvasSize / 2} ${canvasSize / 2}) scale(${scale}) translate(${-MARK_CENTER_X} ${-MARK_CENTER_Y})">
    <path fill="${fill}" fill-rule="evenodd" d="${pathD}"/>
  </g>
</svg>`
}

async function writePng(filename, svg) {
  const outPath = join(assetsDir, filename)
  await sharp(Buffer.from(svg)).png().toFile(outPath)
  const meta = await sharp(outPath).metadata()
  console.log(`Wrote ${filename} (${meta.width}×${meta.height})`)
}

async function writeAndroidNotificationDrawables() {
  for (const [folder, px] of Object.entries(ANDROID_NOTIFICATION_ICON_SIZES)) {
    const dir = join(androidResDir, folder)
    mkdirSync(dir, { recursive: true })
    const outPath = join(dir, 'notification_icon.png')
    const svg = buildCanvasSvg({
      includeBackground: false,
      fill: NOTIFICATION_FILL,
      canvasSize: px,
      logoWidthRatio: NOTIFICATION_LOGO_WIDTH_RATIO,
    })
    await sharp(Buffer.from(svg)).png().toFile(outPath)
    console.log(`Wrote android/.../res/${folder}/notification_icon.png (${px}×${px})`)
  }
}

const notificationSvg = buildCanvasSvg({
  includeBackground: false,
  fill: NOTIFICATION_FILL,
  canvasSize: 96,
  logoWidthRatio: NOTIFICATION_LOGO_WIDTH_RATIO,
})

await writePng('icon.png', buildCanvasSvg({ includeBackground: true, fill: LOGO_FILL, canvasSize: SIZE, logoWidthRatio: LOGO_WIDTH_RATIO }))
await writePng(
  'adaptive-icon.png',
  buildCanvasSvg({ includeBackground: false, fill: LOGO_FILL, canvasSize: SIZE, logoWidthRatio: LOGO_WIDTH_RATIO }),
)
await writePng('notification-icon.png', notificationSvg)
await writeAndroidNotificationDrawables()
