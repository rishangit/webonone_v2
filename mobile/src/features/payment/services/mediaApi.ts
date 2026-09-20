import { env } from '@/shared/config/env'
import { secureStorage } from '@/shared/services/secureStorage'

export type UploadedMediaItem = {
  id: string
  url: string
  fileName: string
}

/** Scope payment:company:{companyId} → disk payment/companies/{companyId}/ */
export function buildPaymentCompanyMediaScope(companyId: string): string {
  return `payment:company:${companyId}`
}

/** Invoice receipt slot → payment/companies/{id}/receipts/{invoiceId}/ */
export function buildInvoiceReceiptFolderPath(invoiceId: string): string {
  return `/receipts/${invoiceId}`
}

export async function uploadReceiptFile(input: {
  uri: string
  fileName: string
  mimeType: string
  companyId: string
  invoiceId: string
}): Promise<UploadedMediaItem> {
  const token = await secureStorage.getAccessToken()
  if (!token) {
    throw new Error('Your session expired. Please sign in again.')
  }

  const formData = new FormData()
  formData.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob)
  formData.append('scope', buildPaymentCompanyMediaScope(input.companyId))
  formData.append('folderPath', buildInvoiceReceiptFolderPath(input.invoiceId))

  const response = await fetch(`${env.mediaApiBaseUrl}/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      `Upload failed (${response.status})`
    throw new Error(message)
  }

  const item = data?.item as UploadedMediaItem | undefined
  if (!item?.id || !item.url) {
    throw new Error('Upload succeeded but media response was invalid.')
  }

  return {
    id: item.id,
    url: item.url,
    fileName: item.fileName ?? input.fileName,
  }
}
