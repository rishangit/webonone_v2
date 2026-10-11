/** Shared copy injected before {{footerHtml}} in email templates. */
export const EMAIL_WEBONONE_HTML_BLOCK = `<p style="margin-top: 16px;"><a href="{{webOnOneUrl}}">Open in WebOnOne</a></p>
`

export const EMAIL_WEBONONE_TEXT_BLOCK = `

Open in WebOnOne: {{webOnOneUrl}}
`

export function injectEmailWebOnOneLink(htmlBody: string, textBody: string): {
  htmlBody: string
  textBody: string
} {
  if (htmlBody.includes('{{webOnOneUrl}}')) {
    return { htmlBody, textBody }
  }

  const htmlBodyNext = htmlBody.includes('{{footerHtml}}')
    ? htmlBody.replace('{{footerHtml}}', `${EMAIL_WEBONONE_HTML_BLOCK}{{footerHtml}}`)
    : `${htmlBody}${EMAIL_WEBONONE_HTML_BLOCK}`

  let textBodyNext = textBody
  if (textBody.trim()) {
    textBodyNext = textBody.includes('{{footerHtml}}')
      ? textBody.replace('{{footerHtml}}', `${EMAIL_WEBONONE_TEXT_BLOCK}{{footerHtml}}`)
      : `${textBody}${EMAIL_WEBONONE_TEXT_BLOCK}`
  } else {
    textBodyNext = EMAIL_WEBONONE_TEXT_BLOCK.trim()
  }

  return { htmlBody: htmlBodyNext, textBody: textBodyNext }
}

export function mergeRequiredKey(requiredKeys: unknown, key: string): string[] {
  let keys: string[] = []
  if (Array.isArray(requiredKeys)) {
    keys = requiredKeys.map(String)
  } else if (typeof requiredKeys === 'string') {
    try {
      const parsed = JSON.parse(requiredKeys) as unknown
      if (Array.isArray(parsed)) keys = parsed.map(String)
    } catch {
      keys = []
    }
  }
  if (!keys.includes(key)) {
    keys.push(key)
  }
  return keys
}
