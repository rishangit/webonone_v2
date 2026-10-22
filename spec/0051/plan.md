# Plan 0051 — Designer assistant tasks

## Approach

Keep canvas edits on the existing `apply_design_canvas` / `apply_design_library_canvas` tools. The AI conversation owns the task queue. The designer applies a task only when that task is confirmed.

## AI (`ai/backend`)

1. Add `designerTaskPlan.ts`:
   - Split a canvas `operations` array into tasks at each new `add_block` after the first (header row → header section, company column, page menu).
   - Keep the original change name when it contains `header`, `hero`, or `banner` so column balancing and hero sizing still run on each apply.
   - Parse a JSON task plan (`{"tasks":[{"title","arguments":{"name","operations"}}]}`) from a planner reply.
   - Advance the queue: mark the finished task confirmed or rejected, and return the next queued task only when nothing else is pending.
2. In `conversation.service.ts`, on a `[designer-canvas]` turn:
   - Header and hero shortcuts become a task list (no extra model call). Only the first task is executed.
   - Other designer prompts ask the model, with the published canvas tool description and schema, for that JSON plan. If the JSON is missing, fall back to the normal canvas tool call and split it the same way.
   - When the list has more than one task, store `designerTasks` on the assistant payload and put only the current task in `calls`. Reply text states the task count and that the next task waits.
3. `confirmToolCall` and `rejectToolCall` (single reject, not reject-all) call the same advance helper. The next task is inserted as a pending tool call. Reject-all marks the rest rejected and does not continue.
4. Tests cover the header split (3 tasks), hero (1 task), JSON parse, and queue advance.

## Design

- Tool description: include every requirement, in order; the user confirms one task at a time; Save still persists.
- `DesignerAssistantPanel`: when `designerTasks` has more than one entry, show an ordered checklist (waiting / current / applied / canceled). `ConfirmItemList` stays the confirm control and only receives calls that are already pending or finished. Confirm still calls `onApplyCanvas` for that call only.
- `en` and `si` `designerAssistant` hint and task status strings.

## Support

One sentence on Website pages and the AI assistant capabilities table (`en` + `si`): a multi-part designer request becomes a task list, and each task is confirmed or canceled before the next one changes the canvas.

## Order

Spec files → status `planned` → status `in_progress` → AI plan + conversation → design copy and panel → help → type-check, lint, AI tests → `developed` → development summary → one commit → push `deploy_staging` → `staging`.
