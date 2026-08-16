import type { ThemeDto } from '@webonone/theme'
import { apiClient } from '@/shared/services/apiClient'

export type ApiTheme = {
  id: string
  name: string
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
  createdBy: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export type ListPageMode = 'pagination' | 'on-scroll'

export type PreferencesResponse = {
  activeThemeId: string
  colorMode: 'light' | 'dark'
  listPageMode: ListPageMode
  theme: ApiTheme
}

export type CreateThemeBody = {
  name: string
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
}

export function toThemeDto(theme: ApiTheme): ThemeDto {
  return {
    id: theme.id,
    name: theme.name,
    color1: theme.color1,
    color2: theme.color2,
    color3: theme.color3,
    color4: theme.color4,
    color5: theme.color5,
  }
}

export const themeApi = {
  async listThemes() {
    const data = await apiClient<{ themes: ApiTheme[] }>('/themes')
    return data.themes
  },
  async createTheme(body: CreateThemeBody) {
    const data = await apiClient<{ theme: ApiTheme }>('/themes', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.theme
  },
  async updateTheme(id: string, body: Partial<CreateThemeBody>) {
    const data = await apiClient<{ theme: ApiTheme }>(`/themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.theme
  },
  deleteTheme(id: string) {
    return apiClient<void>(`/themes/${id}`, { method: 'DELETE' })
  },
  getPreferences() {
    return apiClient<PreferencesResponse>('/me/preferences')
  },
  patchPreferences(body: {
    activeThemeId?: string
    colorMode?: 'light' | 'dark'
    listPageMode?: ListPageMode
  }) {
    return apiClient<PreferencesResponse>('/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
