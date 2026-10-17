import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import type { WebsitePageStatus } from '../models/db.js'
import type { WebsiteChromeKind } from '../services/websiteChrome.service.js'
import {
  copyLibraryChrome,
  copyLibraryLayout,
  copyLibraryPage,
  copyLibraryPreset,
  copyLibraryTheme,
  createLibraryChrome,
  createLibraryLayout,
  createLibraryPage,
  createLibraryPreset,
  createLibraryTheme,
  deleteLibraryChrome,
  deleteLibraryLayout,
  deleteLibraryPage,
  deleteLibraryPreset,
  deleteLibraryTheme,
  getLibraryChrome,
  getLibraryLayout,
  getLibraryPage,
  getLibraryPreset,
  getLibraryTheme,
  listLibraryChrome,
  listLibraryLayouts,
  listLibraryPages,
  listLibraryPresets,
  listLibraryThemes,
  updateLibraryChrome,
  updateLibraryLayout,
  updateLibraryPage,
  updateLibraryPreset,
  updateLibraryTheme,
} from '../services/websiteComponentLibrary.service.js'
import { createWebsitePageSchema, updateWebsitePageSchema } from '../schemas/websitePages.schema.js'
import { createWebsiteChromeSchema, updateWebsiteChromeSchema } from '../schemas/websiteChrome.schema.js'
import { createWebsitePresetSchema, updateWebsitePresetSchema } from '../schemas/websitePresets.schema.js'
import { createWebsiteLayoutSchema, updateWebsiteLayoutSchema } from '../schemas/websiteLayouts.schema.js'
import { createWebsiteThemeSchema, updateWebsiteThemeSchema } from '../schemas/websiteThemes.schema.js'
import { copyWebsiteLibrarySchema } from '../schemas/websiteLibraryCopy.schema.js'

function userId(req: AuthenticatedRequest): string {
  if (!req.user?.id) throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED')
  return req.user.id
}

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

function listQuery(req: AuthenticatedRequest) {
  const status =
    typeof req.query.status === 'string' && (req.query.status === 'active' || req.query.status === 'inactive')
      ? (req.query.status as WebsitePageStatus)
      : undefined
  return {
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    status,
  }
}

function chromeKind(kind: string): WebsiteChromeKind {
  if (kind === 'headers' || kind === 'footers') return kind
  throw new HttpError(404, 'Not found', 'NOT_FOUND')
}

export async function listLibraryPagesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await listLibraryPages(listQuery(req)))
  } catch (err) {
    next(err)
  }
}

export async function getLibraryPageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json({ page: await getLibraryPage(String(req.params.id)) })
  } catch (err) {
    next(err)
  }
}

export async function createLibraryPageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = await createLibraryPage({ userId: userId(req), body: createWebsitePageSchema.parse(req.body) })
    res.status(201).json({ page })
  } catch (err) {
    next(err)
  }
}

export async function updateLibraryPageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = await updateLibraryPage({
      id: String(req.params.id),
      body: updateWebsitePageSchema.parse(req.body),
    })
    res.json({ page })
  } catch (err) {
    next(err)
  }
}

export async function deleteLibraryPageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteLibraryPage(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function listLibraryChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status: _status, ...query } = listQuery(req)
    res.json(await listLibraryChrome({ kind: chromeKind(String(req.params.kind)), ...query }))
  } catch (err) {
    next(err)
  }
}

export async function getLibraryChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json({ item: await getLibraryChrome(chromeKind(String(req.params.kind)), String(req.params.id)) })
  } catch (err) {
    next(err)
  }
}

export async function createLibraryChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await createLibraryChrome({
      kind: chromeKind(String(req.params.kind)),
      userId: userId(req),
      body: createWebsiteChromeSchema.parse(req.body),
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateLibraryChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await updateLibraryChrome({
      kind: chromeKind(String(req.params.kind)),
      id: String(req.params.id),
      body: updateWebsiteChromeSchema.parse(req.body),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteLibraryChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteLibraryChrome(chromeKind(String(req.params.kind)), String(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function listLibraryPresetsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status: _status, ...query } = listQuery(req)
    res.json(await listLibraryPresets(query))
  } catch (err) {
    next(err)
  }
}

export async function getLibraryPresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json({ item: await getLibraryPreset(String(req.params.id)) })
  } catch (err) {
    next(err)
  }
}

export async function createLibraryPresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await createLibraryPreset({ userId: userId(req), body: createWebsitePresetSchema.parse(req.body) })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateLibraryPresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await updateLibraryPreset({
      id: String(req.params.id),
      body: updateWebsitePresetSchema.parse(req.body),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteLibraryPresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteLibraryPreset(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function listLibraryLayoutsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status: _status, ...query } = listQuery(req)
    res.json(await listLibraryLayouts(query))
  } catch (err) {
    next(err)
  }
}

export async function getLibraryLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json({ item: await getLibraryLayout(String(req.params.id)) })
  } catch (err) {
    next(err)
  }
}

export async function createLibraryLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await createLibraryLayout({
      userId: userId(req),
      body: createWebsiteLayoutSchema.parse(req.body),
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateLibraryLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await updateLibraryLayout({
      id: String(req.params.id),
      body: updateWebsiteLayoutSchema.parse(req.body),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteLibraryLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteLibraryLayout(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function listLibraryThemesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status: _status, ...query } = listQuery(req)
    res.json(await listLibraryThemes(query))
  } catch (err) {
    next(err)
  }
}

export async function getLibraryThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json({ theme: await getLibraryTheme(String(req.params.id)) })
  } catch (err) {
    next(err)
  }
}

export async function createLibraryThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const theme = await createLibraryTheme({
      userId: userId(req),
      body: createWebsiteThemeSchema.parse(req.body),
    })
    res.status(201).json({ theme })
  } catch (err) {
    next(err)
  }
}

export async function updateLibraryThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const theme = await updateLibraryTheme({
      id: String(req.params.id),
      body: updateWebsiteThemeSchema.parse(req.body),
    })
    res.json({ theme })
  } catch (err) {
    next(err)
  }
}

export async function deleteLibraryThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteLibraryTheme(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function copyLibraryPageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = copyWebsiteLibrarySchema.parse(req.body)
    const page = await copyLibraryPage({ companyId: companyIdOrThrow(req), userId: userId(req), libraryId: body.libraryId })
    res.status(201).json({ page })
  } catch (err) {
    next(err)
  }
}

export async function copyLibraryChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = copyWebsiteLibrarySchema.parse(req.body)
    const item = await copyLibraryChrome({
      kind: chromeKind(String(req.params.kind)),
      companyId: companyIdOrThrow(req),
      userId: userId(req),
      libraryId: body.libraryId,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function copyLibraryPresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = copyWebsiteLibrarySchema.parse(req.body)
    const item = await copyLibraryPreset({
      companyId: companyIdOrThrow(req),
      userId: userId(req),
      libraryId: body.libraryId,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function copyLibraryLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = copyWebsiteLibrarySchema.parse(req.body)
    const item = await copyLibraryLayout({
      companyId: companyIdOrThrow(req),
      userId: userId(req),
      libraryId: body.libraryId,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function copyLibraryThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = copyWebsiteLibrarySchema.parse(req.body)
    const theme = await copyLibraryTheme({
      companyId: companyIdOrThrow(req),
      userId: userId(req),
      libraryId: body.libraryId,
    })
    res.status(201).json({ theme })
  } catch (err) {
    next(err)
  }
}
