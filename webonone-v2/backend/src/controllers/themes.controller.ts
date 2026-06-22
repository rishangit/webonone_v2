import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import * as themeService from '../services/themeService.js'

export async function listThemes(req: AuthenticatedRequest, res: Response) {
  const themes = await themeService.listThemes(req.user!.id)
  res.json({ themes })
}

export async function createTheme(req: AuthenticatedRequest, res: Response) {
  const theme = await themeService.createTheme(req.user!.id, req.body)
  res.status(201).json({ theme })
}

export async function getTheme(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const theme = await themeService.getThemeById(id, req.user!.id)
  if (!theme) {
    res.status(404).json({ message: 'Theme not found', code: 'NOT_FOUND' })
    return
  }
  res.json({ theme })
}

export async function updateTheme(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const result = await themeService.updateTheme(id, req.user!.id, req.body)
  if (!result.ok) {
    if (result.reason === 'not_found') {
      res.status(404).json({ message: 'Theme not found', code: 'NOT_FOUND' })
      return
    }
    res.status(403).json({ message: 'Cannot modify this theme', code: 'FORBIDDEN' })
    return
  }
  res.json({ theme: result.theme })
}

export async function deleteTheme(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const result = await themeService.deleteTheme(id, req.user!.id)
  if (!result.ok) {
    if (result.reason === 'not_found') {
      res.status(404).json({ message: 'Theme not found', code: 'NOT_FOUND' })
      return
    }
    res.status(403).json({ message: 'Cannot delete this theme', code: 'FORBIDDEN' })
    return
  }
  res.json({ id, deleted: true })
}
