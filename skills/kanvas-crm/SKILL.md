---
name: kanvas-crm
description: Use when interacting with the Kanvas CRM to manage leads, pipelines, send template emails, create follow-ups, upload files, and log sales activity.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.kanvas"]}}}
---

# Kanvas CRM Skill

This skill provides operational guidance and technical best practices for using the Kanvas CRM plugin effectively.

## Core Features & Usage Patterns

### 1. HTML Email Templates (Laravel Blade)
When sending emails via `kanvas_send_anonymous_email` using Kanvas notification templates, the backend uses Laravel Blade.
- **The Issue:** Blade escapes HTML tags by default (`{{ $message }}`), causing `<br>` and `<strong>` to render as raw text.
- **The Fix:** Ensure the backend template uses unescaped syntax (`{!! $message !!}`). Pass raw HTML in your message payloads to render properly formatted emails.

### 2. Updating Lead Pipelines
Use the native `kanvas_update_lead` tool.
- Pass `id` and `input: { pipeline_stage_id: XYZ }`.
- The plugin auto-fetches required fields (`branch_id`, `people_id`) behind the scenes as of v0.1.8+. No custom GraphQL scripts are necessary.

### 3. Updating Contacts (People)
Use the native `kanvas_update_people` tool.
- You can seamlessly append phone numbers, emails, and custom fields to a Contact profile.
- Pass the contacts array with the correct `contacts_types_id` (e.g., 1 for Email, 2 for Phone). Call `kanvas_list_contact_types` first if you are unsure of the IDs.

### 4. File Attachments
Use the native tools:
- `kanvas_attach_file_to_lead_by_url`: Supply a public URL to download a PDF or image straight to the Lead profile.
- `kanvas_upload_file_to_lead` / `kanvas_upload_file_to_message`: If passing base64 or a local file path.

### 5. Follow-ups and Task Management
Use the native `kanvas_create_follow_up` tool.
- **Why:** Do not use local text files (`MEMORY.md`) to manage the sales pipeline reminders. If you schedule a follow-up, the human team needs to be able to see it natively inside the Kanvas dashboard.
- **Usage:** Create a calendar event, pass the `lead_id`, `date`, `start_time`, and `end_time`. Use `kanvas_list_events` during your morning sweep to execute them.

### 6. Participant API & Relationship Creation
When using `kanvas_add_lead_participant`, the CRM requires a `relationship_id`.
- **Pre-requisite:** Before attaching a person to a lead, ensure a relationship type exists (like "Architect", "Client", or "Consultant").
- **Tool:** Use `kanvas_create_people_relationship` to dynamically create the relationship if it's missing, get its ID, and then call `kanvas_add_lead_participant`.

### 7. Anti-Pollution & Context Isolation
When handling multiple outbound conversations, strictly avoid mixing up client details.
- **The CRM is the Single Source of Truth:** Before drafting a reply or follow-up, the agent must query Kanvas for the specific Lead ID (`kanvas_get_lead`), read the Lead Profile, and fetch the Message Channel history (`kanvas_list_lead_messages`). Build the response *strictly* based on this retrieved data.
- **Stateless Prompting (Sub-Agents):** For complex negotiations or drafting highly technical pitches, spawn an isolated sub-agent session. Feed the sub-agent *only* the data for that specific lead and the required reference projects, retrieve the drafted text, and terminate the sub-agent to ensure zero cross-contamination.

### 8. Email Logging & Deduplication
To avoid sending the same update or repeating the same information to clients and the team:
- **Logging:** EVERY outbound email sent (e.g., via `kanvas_send_anonymous_email` or custom scripts) MUST be immediately logged into Kanvas using a direct GraphQL `CreateMessage` mutation with the `message_verb: "agent_email_log"`.
- **Payload Structure:** The `message` JSON payload must include the exact `subject`, `date`, `recipients` (array of emails), and `body` (the full HTML/text sent).
- **Reviewing:** Before drafting a daily report or a follow-up pitch, query the CRM for messages with the `message_verb: "agent_email_log"` to review past logs and ensure you do not repeat topics that were covered in previous emails.

### 9. Lead Generation & Injection (The Sourcing Loop)
When sourcing targets automatically (via Apollo API or Web Search):
- **Quota:** Source exactly 5 distinct companies/projects per run (10 per day: morning and after-lunch sweeps).
- **Deduplication:** Always query Kanvas (`kanvas_search_leads`) by the prospect's email or company name *before* creating a new lead to prevent duplicate entries and spamming.
- **Injection:** Create the Lead using `kanvas_create_lead` in the "Prospecting" stage with the correct ICP Lead Type and Source.
- **Documentation:** Draft the initial cold email pitch and attach it as a note to the Lead profile so the leadership team can review it natively before sending.
- **Reporting:** When sending the daily Approval Report email, you MUST include the strategic rationale (the "Why") directly in the email body, and link the company name directly to its CRM dashboard page using this exact URL format:
  `https://kanvas.domain/projects/{app-uuid}/leads/{leaduuid}`

### 10. Structured Pitch Notes (JSON)
When attaching a drafted cold email or pitch to a Lead profile for human review, DO NOT pass it as a raw string.
- **Requirement:** The UI parses pitches better when passed as a structured JSON object.
- **Format:** When calling `kanvas_add_lead_note_by_lead_id`, pass the `message` payload as a structured object containing ONLY `title` and `body` fields.
- **Title Formatting:** The title must be a clean, professional string in Norwegian (e.g., `Utkast til e-post: [Selskap]`). Never include debugging or array tags in the title.
- **Body Formatting Rule:** Do NOT use explicit `\n\n` strings or JSON arrays in the `body`. Use the HTML `<br><br>` format for a single, continuous `body` string so that Kanvas frontend renders the JSON payloads with clean line breaks instead of visible newline escape characters.

### 11. Apollo Integration & Contact Enrichment
When using Apollo API to source leads, always extract the following fields and map them to Kanvas:
- **Email:** Use `kanvas_list_contact_types` to find the ID (usually 1) and map to `contacts: [{ value: email, contacts_types_id: 1 }]`.
- **LinkedIn Profile (Optional):** If the contact has a `linkedin_url`, extract it and map to `contacts: [{ value: linkedin_url, contacts_types_id: 5 }]`. Do not fail or block the lead creation if the LinkedIn profile is missing.
- **Phone Numbers:** Apollo requires a webhook to reveal direct phone numbers. Until this is built into Kanvas, phone numbers cannot be automatically extracted via the synchronous API.

### 12. White-Labeling & Value Communication
When communicating with the leadership team, founders, or human architects, NEVER mention the specific technical backend tools (e.g., Apollo, Kanvas, OpenClaw, GraphQL).
- **The Value Proposition:** Human teams only care about the *results*: qualified meetings booked, deals moved to the next stage, and a healthy sales pipeline. They do not care about the APIs used to get there.
- **Reporting Rule:** In daily summaries and rationale notes, use generic business terminology. Instead of "Sourced via Apollo API," say "Identified via market intelligence." Instead of "Injected into Kanvas," say "Added to the CRM pipeline."
- **Internal Tagging:** If you need to track the origin of a lead for analytics, use native CRM tags or the `LeadSource` field silently in the backend payload. Do not expose the data provider in the public-facing text notes or emails.q