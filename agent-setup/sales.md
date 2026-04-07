# Deal Architect / Sales Agent Setup Protocol

This document outlines the standard operating procedure (SOP) for configuring a new autonomous sales agent (Deal Architect) within the Kanvas ecosystem using Kanvas Plugin v0.1.8+.

---

## Phase 1: Core Persona & Rules Configuration

### 1. Hidden Reasoning
Instruct the agent to never expose its internal thinking process to the end-user or clients.

### 2. White-labeling
Instruct the agent to refer to the "Kanvas" system generically as:
- "your database"
- "the CRM"

When communicating with clients or external parties.

---

## Phase 2: Plugin & Technical Integration

### 1. Kanvas Credentials
Verify the configuration includes:
- `xKanvasApp`
- `xKanvasLocation`
- Agent `email`
- Agent `password`
- `xKanvasKey` (App Key)

### 2. Email Template Setup

- Identify or create a branded HTML email template (e.g., `incube-template`)

#### Blade Syntax Fix

Ensure the backend Laravel Blade template renders the message body using unescaped syntax:

```php
{!! $message !!}
```

This allows the agent to send:
- Bold text  
- Links  
- Line breaks  
- Full HTML formatting  

---

## Phase 3: Team Onboarding & Data Gathering

### 1. Draft Welcome Email

The agent drafts an onboarding email to the core team requesting:

- **Working Email Credentials**  
  Ensure backend email syncing is active

- **Ideal Customer Profile (ICP)**  
  Target audience descriptions

- **Priority Reference Projects**  
  3–5 strongest past projects for tailored pitches

### 2. Communication Channel

Provide the team with a direct link to the agent’s:
- Telegram bot  
- Slack bot  

---

## Phase 4: CRM Customization (Native Tools)

### 1. Pipeline Stages

Use Kanvas dashboard (or API) to map the pipeline:

Prospecting → Needs Analysis → Proposal / Pitch Sent → In Negotiation → Contract Sent → Closed Won

### 2. Categorization

Use:

- `kanvas_create_lead_type`
- `kanvas_create_lead_source`

To match:
- ICP  
- Acquisition strategy  

### 3. Relationships

Use:

`kanvas_create_people_relationship`

To ensure standard relationships exist before adding participants:

- Client  
- Architect  
- Decision Maker  

---

## Phase 5: Automated Reporting (Mandatory)

Every autonomous sales agent must send an automated morning summary.

### 1. Daily Heartbeat

Configure:

`HEARTBEAT.md`

To trigger a daily task (e.g., 07:00–08:00 UTC).

### 2. Cron Logic

- Check `MEMORY.md` to avoid duplicate emails
- Query CRM for:

`message_verb: "agent_email_log"`

- Review past emails to prevent repetition
- Draft summary of:
  - Leads
  - Emails
  - Pipeline updates
  - Scheduled follow-ups
- Send via:

`kanvas_send_anonymous_email`

- Use branded template
- Send to team distribution list
- Log email as CRM message:

`message_verb: "agent_email_log"`

- Update:

`MEMORY.md`

With the current date

---

## Phase 6: Anti-Pollution & Context Isolation

Sales agents must strictly avoid cross-polluting client data.

### 1. Isolated Contexts
Treat every interaction as a discrete transaction.

### 2. CRM is the Source of Truth

Always query Kanvas before replying:

- `kanvas_get_lead`
- `kanvas_list_lead_messages`

### 3. Stateless Prompting (Sub-Agents)

For complex pitches:

- Spawn isolated sub-agent sessions  
- Use only that specific lead’s data  

---

## Phase 7: Two-Way Email Integration (CRM-Managed)

Agents must NEVER handle raw IMAP/SMTP credentials.

### 1. Outbound

Handled via CRM routing.

### 2. Inbound (CRM Webhooks)

- CRM monitors inbox
- When a prospect replies:
  - Message is logged in Lead’s message channel
  - Agent is notified to respond

---

## Final Notes

- Keep all communication consistent with CRM data
- Avoid duplicate outreach
- Maintain strict context isolation between leads
- Always prioritize clarity, relevance, and forward movement in conversations

---

**Owner:** Kanvas Sales Agent System  
**Version:** v0.1.8+
