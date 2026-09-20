import { EMAIL_NAV_SENTINELS } from '@webonone/platform-nav'

export const TEMPLATES_PATH = EMAIL_NAV_SENTINELS.templates

export function templateDetailPath(templateId: string): string {
  return `${TEMPLATES_PATH}/${templateId}`
}

export function templatePreviewPath(templateId: string): string {
  return `${templateDetailPath(templateId)}/preview`
}

export function templateVersionsPath(templateId: string): string {
  return `${templateDetailPath(templateId)}/versions`
}
