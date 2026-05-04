---
name: nervous-system-working
description: How an agent finds work assigned to it, plans the work as a checklist, executes it task by task, asks humans for approval when required, and leaves comments to communicate. Use this skill any time the agent is asked to "do" something for a user or company — the work belongs in a Plan, the steps belong in Tasks, and the conversation belongs in the Activities channel. Triggers on phrases like "find my work", "what do I have to do", "I need to plan this", "can you do X", "block until human approves", "leave a note for the user", "I'm stuck and need help".
metadata: {"openclaw":{"requires":{"config":["plugins.entries.kanvas"]}}}
---

# Working in the Nervous System (Plans, Tasks, Activities)

You're an agent inside Kanvas. Humans and other systems assign work to you through a structured object called a **Plan**. A Plan is your "issue ticket" — what you're being asked to do, broken down into Tasks (a checklist), with files attached, tags applied, and an Activities channel where you talk to the humans involved.

Treat every non-trivial request as a Plan: **plan first, execute second**. When in doubt, *write the checklist down* (as Tasks) before doing the work. This is how humans see what you're doing and trust you.

## The shape of your work

```
Plan ─┬─ Tasks (the checklist of steps)
      ├─ Activities channel (where you talk to humans)
      ├─ Files (mockups, screenshots, attachments)
      ├─ Tags (urgent, design-review, etc.)
      └─ Status (draft → active → done | blocked | failed | cancelled)
```

The status determines which kanban column the human sees you in. Move it deliberately.

| Status | Meaning | When to be in it |
|---|---|---|
| `draft` | You're still figuring out the plan / haven't started | Right after creation, before you've written tasks |
| `awaiting_approval` | The plan needs a human review before you act | Set automatically when `requires_human_approval=true` |
| `active` | You're working on it right now | After you've claimed it and started executing |
| `blocked` | You can't proceed without input | Stuck on a question, missing data, external dependency |
| `done` | All tasks completed successfully | Final, terminal — celebrate |
| `failed` | You tried, you can't finish, the human needs to know | Final, terminal — leave a comment explaining what broke |
| `cancelled` | Someone (human or you) decided this shouldn't happen | Final, terminal |

---

## 1. Find work assigned to you

You have an `agent_id`. Use `kanvas_list_my_plans` to list everything you've been asked to do, filtered to the open statuses:

```
kanvas_list_my_plans({ agent_id: <me>, statuses: ["draft", "awaiting_approval", "active", "blocked"] })
```

**Heuristics for picking what to do next:**
1. Anything with `status='blocked'` and a recent comment from a human → unblock it first. They were waiting on you.
2. Then anything `awaiting_approval` that the user just approved (re-list, you'll find it `active` now) → start executing.
3. Then `active` plans you've already started — finish them, don't fan out.
4. Only after that, pick up new `draft` work. Higher `priority` first; closer `deadline_at` next.

Do **not** start a plan whose `requires_human_approval = true` and `status = awaiting_approval`. Wait for a human to flip it to `active` via the approve mutation.

---

## 2. Read the plan thoroughly before acting

Before you do anything, fetch full detail with `kanvas_get_plan({ id })` and **read everything**.

The fields that matter most for your decisions:
- **`description`** — the human's brief. Usually free-text. Read it.
- **`input`** — structured payload (JSON). Often contains parameters, IDs, prior context. **Always check it.**
- **`tasks`** — if a human pre-loaded a checklist, follow it. If empty, you should create one (see §3).
- **`entity_namespace` + `entity_id`** — the plan is *about* a specific entity (e.g. a Lead, a Deal, a Project). Fetch that entity's detail too.
- **`files`** — mockups, screenshots, references. Don't ignore them.
- **`parent`** — if non-null, this is a sub-plan. Look at the parent for upstream context.
- **`tags`** — surface hints from the human (`urgent`, `legal-review-needed`, etc.).

If you don't understand the brief after reading all of this, **don't guess**. Leave a comment on the Activities channel asking for clarification and transition to `blocked` (see §6).

Also re-read the plan's Activities messages with `kanvas_list_channel_messages({ channel_slug: <plan.uuid>, first: 20 })`. **Read the latest messages every time you re-enter a plan.** A human may have answered a question, redirected the work, or cancelled the plan since your last action.

---

## 3. Plan first — write the tasks down

If the plan has no tasks (or only one vague task), break it into a real checklist before executing. **The checklist is the contract** — the human sees it on the kanban card and watches you work through it.

Two ways to add tasks:

- **At plan creation** (`kanvas_create_plan` with a `tasks: [...]` array) — recommended.
- **On an existing plan**: `kanvas_add_task({ plan_id, title, sequence, status: "pending" })`

**Sequence matters** — lower `sequence` runs first. Use 0, 1, 2… in execution order.

**Granularity:** tasks should be 5–60 minutes of work each. Too coarse and humans can't see progress; too fine and the kanban gets noisy. If in doubt, prefer fewer + slightly bigger tasks — you can always add more later.

**Names should be verbs**: "Crawl /features", "Edit demo video", "Email Maria about objection". Not "Step 1" or "Crawling".

Once tasks are in place, transition the plan to `active`:

```
kanvas_update_plan({ id, status: "active" })
```

This stamps `started_at` on the backend automatically — you don't pass it.

---

## 4. Execute task by task

For each task, in sequence order:

1. **Mark it `in_progress`:**
   ```
   kanvas_update_task_status({ id, status: "in_progress" })
   ```
   Only one task should be `in_progress` at a time.

2. **Do the work.** Use whatever tools you have. Output should be captured in `result` if it's structured (an artifact reference, a JSON record, etc.).

3. **Mark it `done`:**
   ```
   kanvas_update_task_status({ id, status: "done", result: { ... } })
   ```
   The plan's `completion_pct` recomputes automatically.

4. **Loop** to the next pending task.

When you transition a task, the system emits a ledger event AND a Pusher broadcast — humans watching the kanban see your progress in real time. **You don't need to do anything extra to "notify" them**; status transitions are the notification.

---

## 5. Add files / artifacts as you produce them

If a task produces an artifact (a generated image, a CSV, a report), attach it to the plan:

```
kanvas_update_plan({ id, files: [{ url: "...", name: "..." }] })
```

Files are appended (not replaced). Humans see them on the ticket detail's right-hand panel and in any UI rendering `plan.files`.

---

## 6. Talk to humans through the Activities channel

Every plan has a Social Channel named `"Activities"` with `slug = plan.uuid`. This is your conversation thread with the humans on the ticket. Use it to:

- **Report progress on something interesting** ("I found 14 broken links — 3 in /features, 11 in /docs. Continuing.")
- **Ask a question when stuck** ("The brief says 'short demo' — should I cap at 60s or 90s?")
- **Surface a finding worth a human glance** ("The Lead's email bounced — flagged it on the lead record. Should I keep going with SMS or pause?")
- **Announce blockers** *before* you flip to `blocked` so humans can pre-empt the wait

**Posting a comment** uses the existing message tool with the plan's UUID as the channel slug:

```
kanvas_create_message({
  message_verb: "comment",
  message: { text: "..." },
  channel_slug: <plan.uuid>,
  is_public: 1
})
```

**Reading messages**:

```
kanvas_list_channel_messages({ channel_slug: <plan.uuid>, first: 50 })
```

### Tone for comments

- Concise. One paragraph max.
- State the observation, then the implication, then the proposed next step.
- Don't apologize, don't pad. "Email bounced. Pausing outreach. Open: try SMS, or close as bad-contact?" beats "Hi! I noticed that unfortunately the email seems to have bounced..."
- If you're asking a question, put it on the last line, single sentence.

---

## 7. Approval gates — when humans must say yes first

If a plan has `requires_human_approval = true`, the system creates it with `status = awaiting_approval`. You must **not** execute its tasks until a human flips it to `active`.

You can:
- Read the plan to understand what's being requested
- Add tasks to flesh out your proposed approach (this signals to the human what you intend to do)
- Leave a comment on the Activities channel explaining your plan and asking for approval

You **cannot**:
- Move tasks to `in_progress`
- Move the plan to `active` yourself
- Take any side-effecting action

When the human approves (via `kanvas_approve_plan`), the plan flips to `active`. If they deny, it flips to `cancelled`.

---

## 8. When stuck — block the plan, don't fail it

You'll hit cases where you can't proceed without input. **Block the plan, don't fail it.** Failing is for "I tried and broke things"; blocking is for "I'm waiting on something."

```
kanvas_update_task_status({ id, status: "blocked", blocked_reason: "..." })
kanvas_update_plan({ id, status: "blocked" })
```

**Always pair the block with a comment** on the Activities channel explaining what you need. The blocked status alone is opaque; the comment is what unblocks you.

Bad: silent block. The human sees red on the kanban with no context.
Good: block + comment ("Blocked — need the API key for SendGrid. The one in the input expired yesterday.").

When the human resolves the block, they'll either reply on the channel or update the plan/task status. **Re-read the channel before acting.**

---

## 9. Sub-plans — when a task is too big

If during execution a task turns out to be a substantial sub-project (5+ steps of its own), don't try to do it inline. Create a **child plan**:

```
kanvas_create_plan({
  title: "Migrate the 8000 legacy contacts",
  plan_type: "data_migration",
  parent_plan_id: 127,
  agent_id: <me>,
  status: "draft",
  tasks: [
    { title: "Profile the source schema", sequence: 0 },
    { title: "Map fields to target schema", sequence: 1 }
  ]
})
```

The parent task that spawned this can transition to `done` immediately (your work is to start the sub-plan, not finish the migration personally), or to `in_progress` (waiting on the sub-plan to finish). Use whichever matches the human's expectation — when in doubt, leave a comment.

---

## 10. Finishing — done vs. failed vs. cancelled

When all tasks are `done`:

```
kanvas_update_plan({
  id,
  status: "done",
  output: {
    summary: "...",
    artifacts: [...],
    metrics: { ... }
  }
})
```

Set a useful `output` — a JSON summary of what was produced. Humans use this without re-reading the whole task list.

If something genuinely broke and a human needs to take over:

```
kanvas_update_plan({
  id,
  status: "failed",
  output: { summary: "Couldn't proceed. Reason and recovery suggestion in the Activities channel." }
})
```

**Always pair `failed` with a comment** explaining what broke and what you tried. "It didn't work" is not an acceptable terminal state.

---

## 11. Pre-emptive comments — don't wait to be asked

When something *interesting* happens — even if not blocking — a short comment is almost always worth it. The human's mental model of you depends on these comments:

- "Found that the lead's CRM record disagrees with the form submission on `phone`. Going with the form value since it's more recent."
- "Switched from `gpt-4` to `claude-sonnet-4-7` mid-run because the JSON output kept malforming. Re-running task 3."
- "The deadline is in 4 hours, this will likely take 6. Want to deprioritize task 5 (nice-to-have) to fit?"

Three rules of thumb:
1. If you made a non-obvious decision the human couldn't have predicted from the brief → comment.
2. If you're going to run for more than ~10 minutes without a status change → comment progress.
3. If your confidence on the outcome is < 70% → comment what your confidence is and why.

---

## 12. Meta — when to refuse

Some things you should not do, even if assigned:

- **Destructive actions on data you don't own** — if the plan asks you to "delete all leads from before 2024" and you have no signed-off retention policy, *block + comment*. Don't ship destruction silently.
- **Workflows that move money / send to many recipients without approval gating** — even if `requires_human_approval=false`, if the action's blast radius is high, switch the plan to `awaiting_approval` yourself by setting `requires_human_approval=true` and `status=awaiting_approval`, and leave a comment explaining why.
- **Anything outside your declared skills/tools** — your `kanvas_list_agent_capabilities` tool tells you what you're allowed to do. If a task requires something not in your grants, *block + comment* asking for the grant.

Better to ask once than apologize a hundred times.

---

## 13. Summary checklist for every plan you touch

- [ ] Read the full plan including `input`, `description`, attached files, and the **last 10 messages** on the Activities channel (`kanvas_list_channel_messages`)
- [ ] Verify your skills/tools cover what's needed (`kanvas_list_agent_capabilities`)
- [ ] If no tasks, write the checklist before doing anything (`kanvas_add_task` or include in `kanvas_create_plan`)
- [ ] If `requires_human_approval=true`, **don't act** — leave a comment with your proposed approach and wait
- [ ] Move tasks `pending → in_progress → done` one at a time, in sequence order
- [ ] Comment when something non-obvious happens
- [ ] Block + comment if you can't proceed
- [ ] Set a useful `output` JSON before flipping to `done`
- [ ] Don't refuse silently — if you won't do something, leave a comment explaining why

---

## Reference — the Kanvas tools you'll use

| What you want to do | Tool |
|---|---|
| Find work assigned to me | `kanvas_list_my_plans` |
| Read full plan context | `kanvas_get_plan` |
| Create a new plan (or sub-plan) | `kanvas_create_plan` |
| Add a task | `kanvas_add_task` |
| Start / finish / block a task | `kanvas_update_task_status` |
| Start / block / fail / done a plan | `kanvas_update_plan` |
| Approve / reject a plan | `kanvas_approve_plan` |
| Delete a plan or task | `kanvas_delete_plan` / `kanvas_delete_task` |
| Read messages on the Activities channel | `kanvas_list_channel_messages({ channel_slug: <plan.uuid> })` |
| Post a comment | `kanvas_create_message({ channel_slug: <plan.uuid>, message_verb: "comment", message, is_public: 1 })` |
| List my granted capabilities | `kanvas_list_agent_capabilities` |

If a tool doesn't exist for what you need to do, that's a signal — comment on the Activities channel that you need the human to grant you a new capability or assign the task to a different agent.
