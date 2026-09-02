import type { PosLibraryRequest, SaleItemKind } from '@/features/sales/types/sales.types'

export const LIBRARY_REQUESTS_NOTE_START = '--- Library requests (not in stock) ---'
export const LIBRARY_REQUESTS_NOTE_END = '--- End library requests ---'

const LINE_PATTERN = /^•\s+(.+?)\s+×(\d+(?:\.\d+)?)\s*$/u

function kindLabelToItemKind(label: string): SaleItemKind {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'service' || normalized === 'services') return 'service'
  if (normalized === 'space' || normalized === 'spaces') return 'space'
  return 'product'
}

export function formatLibraryRequestsNote(requests: PosLibraryRequest[]): string | null {
  if (requests.length === 0) return null
  const lines = requests.map((request) => `• ${request.name} ×${request.quantity}`)
  return [LIBRARY_REQUESTS_NOTE_START, ...lines, LIBRARY_REQUESTS_NOTE_END].join('\n')
}

export function parseLibraryRequestsNote(notes: string | null | undefined): {
  requests: PosLibraryRequest[]
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

  const requests: PosLibraryRequest[] = []
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const match = line.match(LINE_PATTERN)
    if (!match) continue
    const name = match[1]?.trim()
    const quantity = Number(match[2])
    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue
    requests.push({
      key: `parsed-${name}-${requests.length}`,
      itemKind: 'product',
      libraryEntityId: '',
      name,
      quantity,
      imageUrl: null,
    })
  }

  const remainingParts = [before, after].filter(Boolean)
  return {
    requests,
    remainingNotes: remainingParts.length > 0 ? remainingParts.join('\n\n') : null,
  }
}

export function mergeLibraryRequestsIntoNotes(
  libraryRequests: PosLibraryRequest[],
  existingNotes?: string | null,
): string | null {
  const { remainingNotes } = parseLibraryRequestsNote(existingNotes ?? null)
  const libraryBlock = formatLibraryRequestsNote(libraryRequests)
  if (!libraryBlock && !remainingNotes) return null
  if (!libraryBlock) return remainingNotes
  if (!remainingNotes) return libraryBlock
  return `${remainingNotes}\n\n${libraryBlock}`
}

export function buildLibraryRequestFromPick(input: {
  libraryEntityId: string
  name: string
  itemKind: SaleItemKind
  imageUrl?: string | null
}): PosLibraryRequest {
  return {
    key: `${input.libraryEntityId}-${Date.now()}`,
    itemKind: input.itemKind,
    libraryEntityId: input.libraryEntityId,
    name: input.name,
    quantity: 1,
    imageUrl: input.imageUrl ?? null,
  }
}

export { kindLabelToItemKind }
