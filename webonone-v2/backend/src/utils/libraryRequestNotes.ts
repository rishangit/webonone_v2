export const LIBRARY_REQUESTS_NOTE_START = '--- Library requests (not in stock) ---'
export const LIBRARY_REQUESTS_NOTE_END = '--- End library requests ---'

const LINE_PATTERN = /^•\s+(.+?)\s+×(\d+(?:\.\d+)?)\s*$/u

export type ParsedLibraryRequest = {
  name: string
  quantity: number
}

export function parseLibraryRequestsNote(notes: string | null | undefined): {
  requests: ParsedLibraryRequest[]
  remainingNotes: string | null
} {
  if (!notes?.trim()) {
    return { requests: [], remainingNotes: null }
  }

  const startIndex = notes.indexOf(LIBRARY_REQUESTS_NOTE_START)
  if (startIndex === -1) {
    return { requests: [], remainingNotes: notes.trim() || null }
  }

  const endIndex = notes.indexOf(LIBRARY_REQUESTS_NOTE_END, startIndex)
  if (endIndex === -1) {
    return { requests: [], remainingNotes: notes.trim() || null }
  }

  const before = notes.slice(0, startIndex).trim()
  const after = notes.slice(endIndex + LIBRARY_REQUESTS_NOTE_END.length).trim()
  const block = notes
    .slice(startIndex + LIBRARY_REQUESTS_NOTE_START.length, endIndex)
    .trim()

  const requests: ParsedLibraryRequest[] = []
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const match = line.match(LINE_PATTERN)
    if (!match) continue
    const name = match[1]?.trim()
    const quantity = Number(match[2])
    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue
    requests.push({ name, quantity })
  }

  const remainingParts = [before, after].filter(Boolean)
  return {
    requests,
    remainingNotes: remainingParts.length > 0 ? remainingParts.join('\n\n') : null,
  }
}
