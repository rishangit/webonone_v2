/** Copy text in standalone and iframe embeds (Clipboard API often blocked in iframes). */
export async function copyTextToClipboard(text: string): Promise<void> {
  const value = text.trim()
  if (!value) {
    throw new Error('Nothing to copy')
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Fall through — common when Payment runs inside WebOnOne iframe
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, value.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }

  if (!ok) {
    throw new Error('Could not copy')
  }
}
