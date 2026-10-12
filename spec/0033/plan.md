# Plan — Feedback 0033

## Root cause

`getTextLkProviderBalance` returns `configured: false` when `isTextLkReady` is false. `resolveSmsCreditsViewState` maps that to `not_configured`, and `SmsCreditsCard` renders title, copy, and a Configure button (`/devices?tab=settings` or parent navigate). WebOnOne `HomePage` always mounts `SmsCreditsFrame` (`h-52`) for `company_admin` and `super_admin`. The mobile SMS `DashboardScreen` renders the same unconfigured branch.

## Approach

Treat `configured === false` as “do not render the card.” Keep loading (`configured === null`) and error states. On the home embed, post a visibility message to the allowlisted parent so the iframe wrapper stays zero-height until the widget should show. Do not add a shared platform-embed message type.

## Implementation steps

1. **`sms/frontend` `DashboardPage.tsx`**
   - Render `SmsCreditsCard` only when `canViewCredits && smsCredits.configured !== false`.

2. **`sms/frontend` `SmsCreditsCard.tsx`**
   - Return `null` for `not_configured` (no Configure button). Drop `onConfigure` if nothing calls it.

3. **`sms/frontend` `SmsCreditsEmbedPage.tsx`**
   - After the balance result is known, `postMessage` `{ type: 'webonone:sms:credits-widget', visible: boolean }` to `resolvePlatformEmbedParentOrigin` only (never `*`).
   - `visible` is false when `configured === false`; true for a ready balance or an error.
   - Render nothing when not visible.

4. **`webonone-v2` `SmsCreditsFrame.tsx`**
   - Listen for that message from the SMS origin and the frame’s `contentWindow`.
   - Keep the iframe mounted. Apply `h-52` only when `visible` is true; otherwise `h-0` overflow hidden so the home column does not reserve a blank card.

5. **`mobile` `DashboardScreen.tsx`**
   - Omit the credits `Card` when `credits?.configured === false`.

6. **Support** — `en` and `si` `app-preferences/dashboard.md` and `communications/sms-overview.md`: credits card appears when Text.lk is set up; it is not shown otherwise.

7. **Verify** — type-check/lint workspaces in the spec. Existing `resolveSmsCreditsViewState` “not configured” unit test stays valid.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Home layout may shift once when Text.lk is configured and the card appears. Unconfigured companies never see the card or an empty slot.
- A failed balance call still shows the card so retry remains available (`configured` stays null).
