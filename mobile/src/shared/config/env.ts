import Constants from 'expo-constants'



interface MobileEnv {

  identityApiBaseUrl: string

  smsApiBaseUrl: string

  emailApiBaseUrl: string

  dataApiBaseUrl: string

  webononeApiBaseUrl: string

  identityOrigin: string

  emailOrigin: string

  dataOrigin: string

  paymentOrigin: string

  paymentApiBaseUrl: string

  mediaOrigin: string

  mediaApiBaseUrl: string

  designOrigin: string

  designApiBaseUrl: string

  webononeOrigin: string

  supportOrigin: string

  aiOrigin: string

  aiApiBaseUrl: string

  googleWebClientId: string

  expoProjectId: string

}



const extra = (Constants.expoConfig?.extra ?? {}) as Partial<MobileEnv>



function normalizeApiBaseUrl(url: string): string {

  const trimmed = url.replace(/\/+$/, '')

  if (trimmed.endsWith('/api/v1')) return trimmed

  return `${trimmed}/api/v1`

}



function deriveOriginFromApiBase(apiBaseUrl: string): string | null {

  try {

    const parsed = new URL(apiBaseUrl)

    const path = parsed.pathname.replace(/\/api\/v1\/?$/, '')

    return `${parsed.origin}${path}`.replace(/\/$/, '')

  } catch {

    return null

  }

}



function rewriteLocalhostForDevice(url: string): string {

  try {

    const parsed = new URL(url)

    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {

      return url

    }



    const hostUri =

      Constants.expoConfig?.hostUri ??

      (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost



    const lanHost = hostUri?.split(':')[0]

    if (!lanHost || lanHost === 'localhost' || lanHost === '127.0.0.1') {

      return url

    }



    parsed.hostname = lanHost

    return parsed.toString().replace(/\/$/, '')

  } catch {

    return url

  }

}



function isLocalhostHost(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

function resolveApiBaseUrl(
  value: string | undefined,
  fallback: string,
  originForDerive?: string,
): string {
  const origin = originForDerive?.trim()
  const explicit = value?.trim()

  const staleLocalhostExplicit =
    explicit !== undefined &&
    origin !== undefined &&
    isLocalhostHost(normalizeApiBaseUrl(explicit)) &&
    !isLocalhostHost(normalizeApiBaseUrl(origin))

  if (explicit && !staleLocalhostExplicit) {
    return rewriteLocalhostForDevice(normalizeApiBaseUrl(explicit))
  }

  if (origin) {
    return rewriteLocalhostForDevice(normalizeApiBaseUrl(origin))
  }

  return rewriteLocalhostForDevice(normalizeApiBaseUrl(explicit || fallback))
}



function resolveOrigin(

  value: string | undefined,

  fallback: string,

  apiBaseUrlForDerive?: string,

): string {

  const explicit = value?.trim()

  if (explicit) {

    return rewriteLocalhostForDevice(explicit.replace(/\/+$/, ''))

  }



  if (apiBaseUrlForDerive) {

    const derived = deriveOriginFromApiBase(apiBaseUrlForDerive)

    if (derived) {

      return rewriteLocalhostForDevice(derived)

    }

  }



  return rewriteLocalhostForDevice(fallback.replace(/\/+$/, ''))

}



const identityApiBaseUrl = resolveApiBaseUrl(

  extra.identityApiBaseUrl,

  'http://localhost:4011/api/v1',

)

const webononeApiBaseUrl = resolveApiBaseUrl(

  extra.webononeApiBaseUrl,

  'http://localhost:4010/api/v1',

)

const emailApiBaseUrl = resolveApiBaseUrl(
  extra.emailApiBaseUrl,
  'http://localhost:4014/api/v1',
  extra.emailOrigin,
)

const dataApiBaseUrl = resolveApiBaseUrl(
  extra.dataApiBaseUrl,
  'http://localhost:4015/api/v1',
  extra.dataOrigin,
)

const paymentApiBaseUrl = resolveApiBaseUrl(
  extra.paymentApiBaseUrl,
  'http://localhost:4017/api/v1',
  extra.paymentOrigin,
)

const mediaApiBaseUrl = resolveApiBaseUrl(
  extra.mediaApiBaseUrl,
  'http://localhost:4013/api/v1',
  extra.mediaOrigin,
)

const designApiBaseUrl = resolveApiBaseUrl(
  extra.designApiBaseUrl,
  'http://localhost:4019/api/v1',
  extra.designOrigin,
)



export const env: MobileEnv = {

  identityApiBaseUrl,

  smsApiBaseUrl: resolveApiBaseUrl(extra.smsApiBaseUrl, 'http://localhost:4016/api/v1'),

  emailApiBaseUrl,

  dataApiBaseUrl,

  webononeApiBaseUrl,

  identityOrigin: resolveOrigin(extra.identityOrigin, 'http://localhost:3011', identityApiBaseUrl),

  emailOrigin: resolveOrigin(extra.emailOrigin, 'http://localhost:3014', emailApiBaseUrl),

  dataOrigin: resolveOrigin(extra.dataOrigin, 'http://localhost:3015', dataApiBaseUrl),

  paymentOrigin: resolveOrigin(extra.paymentOrigin, 'http://localhost:3017', paymentApiBaseUrl),

  paymentApiBaseUrl,

  mediaOrigin: resolveOrigin(extra.mediaOrigin, 'http://localhost:3013', mediaApiBaseUrl),

  mediaApiBaseUrl,

  designOrigin: resolveOrigin(extra.designOrigin, 'http://localhost:3019', designApiBaseUrl),

  designApiBaseUrl,

  webononeOrigin: resolveOrigin(extra.webononeOrigin, 'http://localhost:3010', webononeApiBaseUrl),

  supportOrigin: resolveOrigin(extra.supportOrigin, 'http://localhost:3021'),

  aiApiBaseUrl: resolveApiBaseUrl(
    extra.aiApiBaseUrl,
    'http://localhost:4020/api/v1',
    extra.aiOrigin,
  ),

  aiOrigin: resolveOrigin(extra.aiOrigin, 'http://localhost:3020', extra.aiApiBaseUrl),

  googleWebClientId: (extra.googleWebClientId ?? '').trim(),

  expoProjectId: (extra.expoProjectId ?? '').trim(),

}


