import fs from 'fs'
import path from 'path'

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p, a)
    else if (e.name.endsWith('.tsx')) a.push(p)
  }
  return a
}

const root = path.resolve('src')
const files = walk(root)
const props = [
  'title',
  'label',
  'placeholder',
  'description',
  'emptyMessage',
  'submitLabel',
  'cancelLabel',
  'aria-label',
  'confirmLabel',
  'deleteLabel',
  'addLabel',
  'editLabel',
  'header',
  'subtitle',
  'message',
  'hint',
  'helperText',
  'loadingLabel',
  'noItemsLabel',
  'searchPlaceholder',
  'primaryActionLabel',
  'secondaryActionLabel',
]

for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  if (c.includes('useTranslation')) continue
  const strings = new Set()
  for (const m of c.matchAll(/>([^<{\n][^<\n]{1,120})</g)) {
    const s = m[1].trim()
    if (/[A-Za-z]/.test(s) && s.length > 1) strings.add(s)
  }
  for (const prop of props) {
    const pr = new RegExp(`${prop}\\s*=\\s*['"]([^'"]+)['"]`, 'g')
    let mm
    while ((mm = pr.exec(c))) strings.add(mm[1])
  }
  for (const m of c.matchAll(/usePlatformLoading\(([^)]+)\)/g)) {
    const sm = m[1].match(/['"]([^'"]+)['"]/g)
    if (sm) sm.forEach((s) => strings.add(s.slice(1, -1)))
  }
  // JSX text in {'...'} or {"..."}
  for (const m of c.matchAll(/\{['"]([A-Za-z][^'"]{1,80})['"]\}/g)) {
    strings.add(m[1])
  }
  // Ternary/string returns that look like UI
  for (const m of c.matchAll(/(?:return|:|\?)\s*['"]([A-Z][a-zA-Z0-9 ,.'!?-]{2,80})['"]/g)) {
    strings.add(m[1])
  }
  if (strings.size) {
    console.log(`\n=== ${path.relative(root, f).replace(/\\/g, '/')} ===`)
    ;[...strings].slice(0, 50).forEach((s) => console.log('  ' + JSON.stringify(s)))
  }
}
