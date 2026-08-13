/**
 * In-memory guard: after a peer/other-tab logout clears website_auth, skip SSO
 * bridge + Identity silent for the rest of this document lifetime.
 * A full reload clears the flag so a later app login can SSO again on refresh.
 */
const LOG = '[website-sso]'

let skipSsoThisDocument = false

export function markWebsiteSsoSkipped(reason: string): void {
  skipSsoThisDocument = true
  console.log(LOG, 'SSO skip ON', { reason })
}

export function isWebsiteSsoSkipped(): boolean {
  return skipSsoThisDocument
}

export function clearWebsiteSsoSkip(reason: string): void {
  if (!skipSsoThisDocument) {
    return
  }
  skipSsoThisDocument = false
  console.log(LOG, 'SSO skip OFF', { reason })
}
