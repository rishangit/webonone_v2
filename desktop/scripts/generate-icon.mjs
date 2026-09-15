import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const size = 512
const pixels = Buffer.alloc(size * size * 4)
const bg = [56, 97, 232]
const fg = [255, 255, 255]
const radius = 96

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const i = (y * size + x) * 4
  pixels[i] = r
  pixels[i + 1] = g
  pixels[i + 2] = b
  pixels[i + 3] = a
}

function inRoundedRect(x, y) {
  const inner = (v, max) => {
    if (v < radius) return radius - v
    if (v >= max - radius) return v - (max - radius - 1)
    return 0
  }
  const dx = inner(x, size)
  const dy = inner(y, size)
  if (dx === 0 || dy === 0) return true
  return dx * dx + dy * dy <= radius * radius
}

function drawLine(x0, y0, x1, y1, thickness) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const steps = Math.ceil(len)
  const half = thickness / 2
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const cx = x0 + dx * t
    const cy = y0 + dy * t
    const xMin = Math.floor(cx - half)
    const xMax = Math.ceil(cx + half)
    const yMin = Math.floor(cy - half)
    const yMax = Math.ceil(cy + half)
    for (let y = yMin; y <= yMax; y += 1) {
      for (let x = xMin; x <= xMax; x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= half * half) {
          setPixel(x, y, fg[0], fg[1], fg[2])
        }
      }
    }
  }
}

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    if (inRoundedRect(x, y)) {
      setPixel(x, y, bg[0], bg[1], bg[2])
    }
  }
}

const s = size
drawLine(s * 0.22, s * 0.28, s * 0.34, s * 0.72, 36)
drawLine(s * 0.34, s * 0.72, s * 0.5, s * 0.46, 36)
drawLine(s * 0.5, s * 0.46, s * 0.66, s * 0.72, 36)
drawLine(s * 0.66, s * 0.72, s * 0.78, s * 0.28, 36)

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

const raw = Buffer.alloc((size * 4 + 1) * size)
for (let y = 0; y < size; y += 1) {
  const rowStart = y * (size * 4 + 1)
  raw[rowStart] = 0
  pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(size, 0)
ihdr.writeUInt32BE(size, 4)
ihdr[8] = 8
ihdr[9] = 6
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
])

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'icon.png')
writeFileSync(outPath, png)
console.log(`Wrote ${outPath}`)
