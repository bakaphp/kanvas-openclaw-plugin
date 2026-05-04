import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { NervousSystemService } from "../domains/nervousSystem/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

const TaskInputSchema = Type.Object({
  title: Type.String({ description: "Task title (verb phrase, e.g. 'Crawl /features')" }),
  sequence: Type.Optional(Type.Number({ description: "Execution order (0, 1, 2...)" })),
  description: Type.Optional(Type.String()),
  status: Type.Optional(Type.String({ description: "pending | in_progress | blocked | done | failed | cancelled" })),
  result: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  blocked_reason: Type.Optional(Type.String()),
});

const FilesInputSchema = Type.Array(
  Type.Object({
    url: Type.String({ description: "Public URL of the file" }),
    name: Type.String({ description: "Display name" }),
    field_name: Type.Optional(Type.String()),
  }),
  { description: "Files to attach (appended, not replaced)" }
);

const PlanStatusSchema = Type.String({
  description: "Plan status: draft | awaiting_approval | active | blocked | done | failed | cancelled",
});

const TaskStatusSchema = Type.String({
  description: "Task status: pending | in_progress | blocked | done | failed | cancelled",
});

export function registerNervousSystemTools(
  api: OpenClawPluginApi,
  service: NervousSystemService,
  ensureAuth: EnsureAuth
) {

  // ── Read ───────────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_list_my_plans",
    label: "List My Plans",
    description:
      "List nervous-system plans assigned to an agent. Filter by statuses to see open work " +
      "(e.g. ['draft','awaiting_approval','active','blocked']). Returns plans ordered by priority desc, deadline asc.",
    parameters: Type.Object({
      agent_id: Type.Union([Type.String(), Type.Number()], { description: "The agent's ID" }),
      statuses: Type.Optional(
        Type.Array(Type.String(), {
          description: "Statuses to include. Default: all.",
        })
      ),
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listMyPlans(params as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_plans",
    label: "List Plans (admin)",
    description:
      "List nervous-system plans with arbitrary where filters. Allowed where columns: " +
      "ID, UUID, AGENT_ID, USERS_ID, ENTITY_NAMESPACE, ENTITY_ID, PLAN_TYPE, STATUS, PRIORITY, PARENT_PLAN_ID.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      where: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      orderBy: Type.Optional(
        Type.Array(
          Type.Object({
            column: Type.String(),
            order: Type.String({ description: "ASC or DESC" }),
          })
        )
      ),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listPlans(params as any));
    },
  });

  api.registerTool({
    name: "kanvas_get_plan",
    label: "Get Plan",
    description:
      "Get full plan detail: description, input/output, tasks, files, tags, agent, user, parent, completion %.",
    parameters: Type.Object({
      id: Type.String({ description: "Plan ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getPlan(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_list_agent_capabilities",
    label: "List Agent Capabilities",
    description: "List the skills and tools an agent has been granted. Use this to verify you can do something before agreeing to a plan.",
    parameters: Type.Object({
      agent_id: Type.String({ description: "Agent ID" }),
      framework: Type.Optional(Type.String({ description: "Framework filter (optional)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getAgentCapabilities(params.agent_id, params.framework));
    },
  });

  // ── Plan write ─────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_create_plan",
    label: "Create Plan",
    description:
      "Create a nervous-system plan (or sub-plan when parent_plan_id is provided). " +
      "Include a tasks array to seed the checklist on creation. For sensitive work, set requires_human_approval=true " +
      "to gate the plan in awaiting_approval status until a human approves.",
    parameters: Type.Object({
      title: Type.String(),
      plan_type: Type.String({ description: 'e.g. "data_migration", "outreach", "report_generation"' }),
      description: Type.Optional(Type.String()),
      agent_id: Type.Optional(Type.Number()),
      users_id: Type.Optional(Type.Number()),
      parent_plan_id: Type.Optional(Type.Number()),
      entity_namespace: Type.Optional(Type.String({ description: "FQCN of the related entity (e.g. App\\\\Models\\\\Lead)" })),
      entity_id: Type.Optional(Type.Number()),
      status: Type.Optional(PlanStatusSchema),
      priority: Type.Optional(Type.Number({ description: "Higher = more important" })),
      deadline_at: Type.Optional(Type.String({ description: "ISO datetime" })),
      input: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      output: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      confidence_score: Type.Optional(Type.Number()),
      requires_human_approval: Type.Optional(Type.Boolean()),
      tasks: Type.Optional(Type.Array(TaskInputSchema)),
      files: Type.Optional(FilesInputSchema),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createPlan(params as any));
    },
  });

  api.registerTool({
    name: "kanvas_update_plan",
    label: "Update Plan",
    description:
      "Update a plan's status, title, description, output, or attach files. " +
      "Use status transitions to signal progress: draft→active to start, active→blocked when stuck, active→done/failed when finished.",
    parameters: Type.Object({
      id: Type.String({ description: "Plan ID" }),
      title: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      status: Type.Optional(PlanStatusSchema),
      priority: Type.Optional(Type.Number()),
      deadline_at: Type.Optional(Type.String()),
      input: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      output: Type.Optional(Type.Record(Type.String(), Type.Unknown()), {
        description: "Final output JSON (set this before flipping to done)",
      } as any),
      confidence_score: Type.Optional(Type.Number()),
      requires_human_approval: Type.Optional(Type.Boolean()),
      files: Type.Optional(FilesInputSchema),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updatePlan(id, input as any));
    },
  });

  api.registerTool({
    name: "kanvas_approve_plan",
    label: "Approve Plan",
    description:
      "Approve or reject a plan that is in awaiting_approval status. Approving flips it to active; rejecting flips it to cancelled.",
    parameters: Type.Object({
      id: Type.String({ description: "Plan ID" }),
      approved: Type.Boolean({ description: "true to approve, false to reject" }),
      review_outcome: Type.Optional(Type.String({ description: "Optional reviewer note" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(
        await service.approvePlan(params.id, {
          approved: params.approved,
          review_outcome: params.review_outcome,
        })
      );
    },
  });

  api.registerTool({
    name: "kanvas_delete_plan",
    label: "Delete Plan",
    description: "Delete a plan by ID.",
    parameters: Type.Object({
      id: Type.String({ description: "Plan ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deletePlan(params.id));
    },
  });

  // ── Task write ─────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_add_task",
    label: "Add Task to Plan",
    description: "Append a task to a plan's checklist. Sequence determines execution order (0, 1, 2...).",
    parameters: Type.Object({
      plan_id: Type.String({ description: "Plan ID" }),
      title: Type.String({ description: "Task title (verb phrase)" }),
      sequence: Type.Optional(Type.Number()),
      description: Type.Optional(Type.String()),
      status: Type.Optional(TaskStatusSchema),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { plan_id, ...input } = params;
      return toolResult(await service.addTask(plan_id, input as any));
    },
  });

  api.registerTool({
    name: "kanvas_update_task_status",
    label: "Update Task Status",
    description:
      "Move a task through its lifecycle: pending → in_progress → done (or blocked/failed/cancelled). " +
      "Set 'result' as JSON when done; set 'blocked_reason' when blocked.",
    parameters: Type.Object({
      id: Type.String({ description: "Task ID" }),
      status: TaskStatusSchema,
      result: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      blocked_reason: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updateTaskStatus(id, input as any));
    },
  });

  api.registerTool({
    name: "kanvas_delete_task",
    label: "Delete Task",
    description: "Delete a task by ID.",
    parameters: Type.Object({
      id: Type.String({ description: "Task ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deleteTask(params.id));
    },
  });
}
