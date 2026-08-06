# 07 — Implementation Plan

Phased delivery for **post-login return page 1.17.0** on branch **`spec/1.17.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.17.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.17.0` |
| Scope | `webonone-v2/frontend` auth return handling; `website/frontend` login CTA capture; optional `packages/platform-nav` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.17.0/*` documentation
- [ ] Branch `spec/1.17.0` pushed

---

## Phase 1 — Validate and preserve return targets

**Goal:** Stop stripping website paths; accept safe WebOnOne return paths. See [02-post-login-return-page.md](./02-post-login-return-page.md).

| Task | Detail |
|------|--------|
| Fix `parseWebsiteReturnUrl` | Keep pathname + search on allowlisted origins; return `null` when invalid |
| Core return path helper | Parse/validate same-origin path for WebOnOne-only returns; reject `/login` loops |
| Optional platform-nav | Align with `parseReturnUrl` if shared helpers reduce duplication |
| Unit tests | Allowlisted deep URL kept; foreign host rejected; malformed rejected |

**Exit criteria:** Parser tests green; manual `/login?return_url=http://127.0.0.1:3018/some/deep` retains `/some/deep` in validated value.

---

## Phase 2 — Wire login host + capture call sites

**Goal:** Post-login restore uses validated targets; guests capture page before login.

| Task | Detail |
|------|--------|
| `LoginPage` / `IdentityLoginFrame` | Pass validated website URL and/or core `returnPath` (remove hardcoded `/`-only behavior when a valid target exists) |
| `useIdentityAuthMessage` + `WebsiteReturnRedirect` | Auth-code to **full** website URL; navigate to core path when applicable |
| Website CTAs | Audit booking / contact / protected actions → `getWebOnOneLoginUrl` with current page |
| WebOnOne guards | When redirecting guests to `/login`, attach return path |

**Exit criteria:** Google and email/password login both restore the requested page; invalid return → homepage.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| Parent: Return user to requested page after login | [86eyhz4mr](https://app.clickup.com/t/86eyhz4mr) | All |
| Remember page → login → restore; homepage fallback | [86eyhz6wv](https://app.clickup.com/t/86eyhz6wv) | Phase 1–2 |

---

## Risks and open items

- **Account / role gate after login** — Existing choose-account / role dialogs ([1.13.1](../1.13.1/README.md)) must still run; apply return navigation **after** session gate completes when a gate is shown.
- **Silent SSO** — Already-authenticated `/login?return_url=…` must use full URL (`WebsiteReturnRedirect`).
- **Multiple website origins** — Allowlist may have more than one pattern; only exact origin match is valid.

---

## Acceptance checklist

- [ ] Website deep link preserved through Google login
- [ ] Website deep link preserved through email/password login
- [ ] WebOnOne protected-route return path works
- [ ] Invalid / missing return → default homepage
- [ ] No open redirect; no secrets in return URL
- [ ] `npm run type-check -w webonone-v2-root` passes
- [ ] Website type-check passes if website changed

## Final verification

```bash
npm run type-check -w webonone-v2-root
npm run type-check -w website-root
```

Manual: deep page → login (Google + email) → same page; bad `return_url` → homepage.
