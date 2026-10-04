# Plan — Feedback 0001

## Approach

Docs-only feature in Support. Expand the existing AI assistant how-to and keep related articles consistent. No WebOnOne or AI service code changes.

## Implementation steps

1. **Expand** `support/frontend/src/content/en/app-preferences/ai-assistant.md`:
   - Keep open/chat/`Copy to AI`/confirm steps.
   - Add a **Capabilities** section: how to find **What the assistant can do** under Basic Settings → AI.
   - List tooling areas in plain language (mirror WebOnOne `settings.json` `ai.supportedAreas.areas` titles/details).
   - Note role / company session filtering, Confirm for writes, and that the card is dynamic.
   - Clarify sparkle vs chat vs guest assistant; link `ai-api-key`, `field-ai-polish`, `guest-assistant`, `signed-in-ai`.
   - Refresh `summary` / title only if needed for search clarity.

2. **Mirror** the same structure in `support/frontend/src/content/si/app-preferences/ai-assistant.md`.

3. **Light cross-link updates** (en + si):
   - `public-catalog/signed-in-ai.md` — point to capabilities section / richer assistant article.
   - `app-preferences/ai-api-key.md` and/or `field-ai-polish.md` — one sentence linking to capabilities when relevant.

4. **Do not** edit `catalog.ts` (glob-based). Do not add deploy/dev ops to articles.

5. **Verify** with `npm run type-check -w support-root` and `npm run lint -w @webonone/support-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before editing support content | `in_progress` |
| Verification passed | `developed` |

## Risks / notes

- Area list in help is educational; live card may omit rows when tools are unavailable — phrase as “may include” / “for your account”.
- Avoid documenting internal tool ids (`list_data_tags`, etc.).
