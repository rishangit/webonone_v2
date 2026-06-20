export const QUERY = {
  CODE: 'code',
  RETURN_URL: 'return_url',
  REDIRECT_URI: 'redirect_uri',
  RETURN_PATH: 'return_path',
  STATE: 'state',
} as const

export const DEFAULT_OAUTH_STATE_PREFIX = 'platform_oauth_state:'
