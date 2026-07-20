const GSM_7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM_7_EXTENDED = '^{}\\[~]|€'

function isGsm7(text: string): boolean {
  for (const char of text) {
    if (!GSM_7_BASIC.includes(char) && !GSM_7_EXTENDED.includes(char)) {
      return false
    }
  }
  return true
}

export interface SmsSegmentInfo {
  chars: number
  segments: number
  encoding: 'GSM-7' | 'UCS-2'
}

export function estimateSegments(text: string): SmsSegmentInfo {
  const gsm7 = isGsm7(text)
  const chars = [...text].length

  if (chars === 0) {
    return { chars: 0, segments: 0, encoding: gsm7 ? 'GSM-7' : 'UCS-2' }
  }

  if (gsm7) {
    const single = 160
    const multi = 153
    const segments = chars <= single ? 1 : Math.ceil(chars / multi)
    return { chars, segments, encoding: 'GSM-7' }
  }

  const single = 70
  const multi = 67
  const segments = chars <= single ? 1 : Math.ceil(chars / multi)
  return { chars, segments, encoding: 'UCS-2' }
}
