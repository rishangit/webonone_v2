import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

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

export type ColorMode = 'light' | 'dark'

export type ListPageMode = 'pagination' | 'on-scroll'

export type UiThemeId = 'classic' | 'high-tech'

export type ThemePreferences = {
  activeThemeId: string
  colorMode: ColorMode
  listPageMode: ListPageMode
  uiTheme: UiThemeId
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

const webononeClient = createApiClient(env.webononeApiBaseUrl)

export const themeApi = {
  async listThemes(): Promise<ApiTheme[]> {
    const data = await webononeClient<{ themes?: ApiTheme[] }>('/themes')
    return Array.isArray(data.themes) ? data.themes : []
  },

  async createTheme(body: CreateThemeBody): Promise<ApiTheme> {
    const data = await webononeClient<{ theme: ApiTheme }>('/themes', {
      method: 'POST',
      body,
    })
    return data.theme
  },

  async updateTheme(id: string, body: Partial<CreateThemeBody>): Promise<ApiTheme> {
    const data = await webononeClient<{ theme: ApiTheme }>(`/themes/${id}`, {
      method: 'PATCH',
      body,
    })
    return data.theme
  },

  async deleteTheme(id: string): Promise<void> {
    await webononeClient<void>(`/themes/${id}`, { method: 'DELETE' })
  },

  async getPreferences(): Promise<ThemePreferences> {
    return webononeClient<ThemePreferences>('/me/preferences')
  },

  async patchPreferences(body: {
    activeThemeId?: string
    colorMode?: ColorMode
    listPageMode?: ListPageMode
    uiTheme?: UiThemeId
  }): Promise<ThemePreferences> {
    return webononeClient<ThemePreferences>('/me/preferences', {
      method: 'PATCH',
      body,
    })
  },
}
