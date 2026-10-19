const CANVAS_BLOCK = /\[designer-canvas\][\s\S]*?\[\/designer-canvas\]/g

const OUTDATED_CANVAS =
  '[designer-canvas]\n(outdated — use the canvas outline in the latest user message)\n[/designer-canvas]'

/** Earlier canvas snapshots are stale once the user has edited by hand. Keep only the newest outline. */
export function keepLatestDesignerCanvas<T extends { role: string; content: string }>(rows: T[]): T[] {
  let latest = -1
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    if (row?.role === 'user' && row.content.includes('[designer-canvas]')) {
      latest = index
      break
    }
  }
  if (latest < 0) return rows
  return rows.map((row, index) => {
    if (row.role !== 'user' || index === latest || !row.content.includes('[designer-canvas]')) return row
    return { ...row, content: row.content.replace(CANVAS_BLOCK, OUTDATED_CANVAS) }
  })
}
