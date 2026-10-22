# Feedback 0051 — Improve the web design tools with AI assistance

| Field | Value |
|-------|-------|
| Ticket | `0051` |
| Feedback id | `7PRQopm3kvEt7triJf-Mx` |
| Type | `feature` |
| Title | improve the web design tools with Ai assistance |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

The website designer assistant should read a prompt completely, turn every requirement into a task, and apply those tasks one at a time. The next task stays waiting until the user confirms or cancels the current one.

## Problem / goal

**Problem:** A prompt with several parts (for example a header row, a company column, and a page menu) is planned as one canvas change. The user confirms the whole batch at once.

**Goal:** Identify every requirement in the prompt, show that list, and run the tasks in order. Confirm or cancel the current task before the next task can change the canvas. Save still persists the canvas.

## Acceptance criteria

1. **Read the whole prompt** — On an open page, header, footer, or preset, a designer prompt is split into one task per requirement, in the order the user wrote them. A single requirement stays one task.
2. **Show the list** — When there is more than one task, the assistant lists every task before any later task is offered. The current task is the only one that can be confirmed.
3. **One at a time** — Confirm applies only that task on the open canvas. Cancel skips it. The next task is then offered. Later tasks are not applied and are not confirmable before that.
4. **Known layouts still build** — The header request (two equal columns, logo and company name on the left, page menu on the right) is three tasks and still lands as an equal header row after each task is confirmed. A single hero image stays one task.
5. **Help** — English and Sinhala help for the designer assistant say that a multi-part request is a task list and that each task is confirmed before the next.

## UI reuse

| Similar UI | Reuse |
|------------|--------|
| Designer chat | `DesignerAssistantPanel` + `AppEndPanel` |
| Confirm / cancel a change | `ConfirmItemList` from `@webonone/ui-kit` |
| New checklist | Inline ordered list in the existing panel (one feature). No new dialog or kit primitive. |

## Services affected

| Area | Change |
|------|--------|
| `ai/backend` | Split designer canvas work into tasks; release the next task only after confirm or cancel |
| `design/backend` | Canvas tool copy: cover every requirement; the user confirms task by task |
| `design/frontend` | Task checklist in the designer assistant; apply only the confirmed task |
| `support` | Designer assistant how-to (`en` + `si`) |

## Out of scope

- Form designer AI
- Changing how non-canvas tools (catalog creates, libraries) confirm
- Auto-save of the canvas
- Setting Support status `closed`

## Verification

```bash
npm test -w @webonone/ai-backend
npm run type-check -w ai-root
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
npm run type-check -w support-root
```
