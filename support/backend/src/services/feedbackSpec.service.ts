import fs from 'fs/promises'
import path from 'path'
import { env } from '../config/env.js'

export const FEEDBACK_SPEC_DOC_FILES = [
  'spec.md',
  'plan.md',
  'development-summary.md',
] as const

export type FeedbackSpecDocFileName = (typeof FEEDBACK_SPEC_DOC_FILES)[number]

export interface FeedbackSpecDocListItem {
  fileName: FeedbackSpecDocFileName
}

export interface FeedbackSpecDocBody {
  fileName: FeedbackSpecDocFileName
  markdown: string
}

const ALLOWED = new Set<string>(FEEDBACK_SPEC_DOC_FILES)

function assertTicketNumber(ticketNumber: string): void {
  if (!/^\d{4}$/.test(ticketNumber)) {
    throw new Error('NOT_FOUND')
  }
}

function resolveTicketDir(ticketNumber: string): string {
  assertTicketNumber(ticketNumber)
  const root = path.resolve(env.feedbackSpecRoot)
  const ticketDir = path.resolve(root, ticketNumber)
  const relative = path.relative(root, ticketDir)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('NOT_FOUND')
  }
  return ticketDir
}

function assertAllowedFileName(fileName: string): FeedbackSpecDocFileName {
  if (!ALLOWED.has(fileName) || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    throw new Error('NOT_FOUND')
  }
  return fileName as FeedbackSpecDocFileName
}

export async function listFeedbackSpecDocs(
  ticketNumber: string,
): Promise<{ items: FeedbackSpecDocListItem[] }> {
  const ticketDir = resolveTicketDir(ticketNumber)
  let entries: string[]
  try {
    entries = await fs.readdir(ticketDir)
  } catch {
    return { items: [] }
  }

  const present = new Set(entries)
  const items = FEEDBACK_SPEC_DOC_FILES.filter((name) => present.has(name)).map((fileName) => ({
    fileName,
  }))
  return { items }
}

export async function readFeedbackSpecDoc(
  ticketNumber: string,
  fileName: string,
): Promise<FeedbackSpecDocBody> {
  const allowed = assertAllowedFileName(fileName)
  const ticketDir = resolveTicketDir(ticketNumber)
  const filePath = path.resolve(ticketDir, allowed)
  const relative = path.relative(ticketDir, filePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('NOT_FOUND')
  }

  try {
    const markdown = await fs.readFile(filePath, 'utf8')
    return { fileName: allowed, markdown }
  } catch {
    throw new Error('NOT_FOUND')
  }
}
