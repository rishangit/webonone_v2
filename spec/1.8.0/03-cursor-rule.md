# 03 — Cursor Rule (feature-page-layout)

Agent-enforced standard for new and migrated **feature pages** in service frontends.

---

## File

| Item | Value |
|------|--------|
| Path | `.cursor/rules/feature-page-layout.mdc` |
| Globs | `**/frontend/src/features/**/pages/**/*.{ts,tsx}` |
| `alwaysApply` | `false` |

Index entry required in [`.cursor/rules/README.md`](../../.cursor/rules/README.md) under **Front-end**.

---

## Rule content (minimum)

The rule must state:

1. **Use `FeaturePage`** from `@webonone/ui-kit` for route pages rendered inside `AppShell` (or equivalent product shell main content).
2. **Do not** hand-roll duplicate `mx-auto max-w-*` + inline `<h1>` blocks on feature pages — use `FeaturePage` / `PageHeader`.
3. **Default** max width is **`4xl`**; use `maxWidth="2xl"` only for narrow form-focused pages (document reason in PR if non-default).
4. **Title typography** — `text-2xl font-semibold`; description — `text-sm text-muted-foreground`.
5. **Header-to-body gap** — always `gap-6` via `FeaturePage` (do not add extra top margin on first child).
6. **Exceptions** — auth pages, iframe/embed chrome, Identity profile card layout; list explicitly in rule.
7. **Reference implementations** — link to refactored WebOnOne pages and showcase demo paths (code paths, not `spec/` links per cursor-rules policy).

---

## Verification section (required)

```bash
npm run type-check -w webonone-v2-root
npm run lint -w webonone-v2-root
```

Spot-check: new feature page imports `FeaturePage` from `@webonone/ui-kit`.

---

## ClickUp subtask mapping

Subtask **spaces and gaps** requirement #4: *"these rules must be enforced by a configuration rule in the cursor file"* — satisfied by this rule file plus README index.
