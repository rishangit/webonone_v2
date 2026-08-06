import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enLibrary from '@/locales/en/library.json'
import siLibrary from '@/locales/si/library.json'
import enUpload from '@/locales/en/upload.json'
import siUpload from '@/locales/si/upload.json'
import enPicker from '@/locales/en/picker.json'
import siPicker from '@/locales/si/picker.json'

export const NAMESPACES = ['shell', 'library', 'upload', 'picker'] as const

export function initMediaI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        library: enLibrary,
        upload: enUpload,
        picker: enPicker,
      },
      si: {
        shell: siShell,
        library: siLibrary,
        upload: siUpload,
        picker: siPicker,
      },
    },
  })
}

export { getAppI18n }
