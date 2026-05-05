import { KanvasClient } from "../../client/kanvas-client.js";
import type {
  ApproveNervousSystemPlanInput,
  CreateNervousSystemPlanInput,
  NervousSystemTaskInput,
  UpdateNervousSystemPlanInput,
  UpdateNervousSystemTaskStatusInput,
} from "./types.js";

const PLAN_DETAIL_FIELDS = `
  id
  uuid
  title
  description
  plan_type
  status
  priority
  deadline_at
  completion_pct
  requires_human_approval
  approved_at
  review_outcome
  started_at
  completed_at
  error_message
  input
  output
  confidence_score
  entity_namespace
  entity_id
  created_at
  updated_at
  agent { id name }
  user { id firstname lastname }
  approver { id firstname lastname }
  parent { id title status }
  tasks { id sequence title description status blocked_reason result started_at completed_at }
  files { data { id uuid name url } }
  tags { data { id name } }
`;

const PLAN_LIST_FIELDS = `
  id
  uuid
  title
  description
  plan_type
  status
  priority
  deadline_at
  completion_pct
  requires_human_approval
  entity_namespace
  entity_id
  created_at
  agent { id name }
  tasks { id sequence title status blocked_reason }
`;

const TASK_FIELDS = `
  id
  uuid
  sequence
  title
  description
  status
  blocked_reason
  result
  started_at
  completed_at
  created_at
  updated_at
`;

export class NervousSystemService {
  constructor(private readonly client: KanvasClient) {}

  // ── Read ───────────────────────────────────────────────────

  async listMyPlans(opts: {
    agent_id: string | number;
    statuses?: string[];
    first?: number;
  }) {
    const { agent_id, statuses, first = 50 } = opts;
    const where: Record<string, unknown> = statuses && statuses.length
      ? {
          AND: [
            { column: "AGENT_ID", operator: "EQ", value: agent_id },
            { column: "STATUS", operator: "IN", value: statuses },
          ],
        }
      : { column: "AGENT_ID", operator: "EQ", value: agent_id };

    const query = `
      query MyPlans($first: Int!, $where: QueryNervousSystemPlansWhereWhereConditions) {
        nervousSystemPlans(
          first: $first
          where: $where
          orderBy: [{ column: PRIORITY, order: DESC }, { column: DEADLINE_AT, order: ASC }]
        ) {
          data { ${PLAN_LIST_FIELDS} }
          paginatorInfo { currentPage lastPage total }
        }
      }
    `;

    return this.client.query(query, { first, where });
  }

  async listPlans(opts: {
    first?: number;
    where?: Record<string, unknown>;
    orderBy?: Array<{ column: string; order: string }>;
  } = {}) {
    const { first = 25, where, orderBy } = opts;
    const query = `
      query ListPlans($first: Int!, $where: QueryNervousSystemPlansWhereWhereConditions, $orderBy: [QueryNervousSystemPlansOrderByOrderByClause!]) {
        nervousSystemPlans(first: $first, where: $where, orderBy: $orderBy) {
          data { ${PLAN_LIST_FIELDS} }
          paginatorInfo { currentPage lastPage total }
        }
      }
    `;

    return this.client.query(query, { first, where, orderBy });
  }

  async getPlan(id: string) {
    const query = `
      query GetPlan($id: ID!) {
        nervousSystemPlan(id: $id) {
          ${PLAN_DETAIL_FIELDS}
        }
      }
    `;

    return this.client.query(query, { id });
  }

  async getAgentCapabilities(agentId: string, framework?: string) {
    const query = `
      query AgentCapabilities($agent_id: ID!, $framework: String) {
        nervousSystemAgentCapabilities(agent_id: $agent_id, framework: $framework) {
          skills {
            id name description skill_type version is_active
          }
          tools {
            id name description tool_type requires_permission version is_active
          }
        }
      }
    `;

    return this.client.query(query, { agent_id: agentId, framework });
  }

  // ── Plan mutations ─────────────────────────────────────────

  async createPlan(input: CreateNervousSystemPlanInput) {
    const mutation = `
      mutation CreatePlan($input: CreateNervousSystemPlanInput!) {
        createNervousSystemPlan(input: $input) {
          ${PLAN_DETAIL_FIELDS}
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  async updatePlan(id: string, input: UpdateNervousSystemPlanInput) {
    const mutation = `
      mutation UpdatePlan($id: ID!, $input: UpdateNervousSystemPlanInput!) {
        updateNervousSystemPlan(id: $id, input: $input) {
          ${PLAN_DETAIL_FIELDS}
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async approvePlan(id: string, input: ApproveNervousSystemPlanInput) {
    const mutation = `
      mutation ApprovePlan($id: ID!, $input: ApproveNervousSystemPlanInput!) {
        approveNervousSystemPlan(id: $id, input: $input) {
          id
          status
          requires_human_approval
          approved_at
          review_outcome
          approver { id firstname lastname }
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async deletePlan(id: string) {
    const mutation = `
      mutation DeletePlan($id: ID!) {
        deleteNervousSystemPlan(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }

  // ── Task mutations ─────────────────────────────────────────

  async addTask(planId: string, input: NervousSystemTaskInput) {
    const mutation = `
      mutation AddTask($plan_id: ID!, $input: NervousSystemTaskInput!) {
        addTaskToNervousSystemPlan(plan_id: $plan_id, input: $input) {
          ${TASK_FIELDS}
        }
      }
    `;

    return this.client.query(mutation, { plan_id: planId, input });
  }

  async updateTaskStatus(id: string, input: UpdateNervousSystemTaskStatusInput) {
    const mutation = `
      mutation UpdateTaskStatus($id: ID!, $input: UpdateNervousSystemTaskStatusInput!) {
        updateNervousSystemTaskStatus(id: $id, input: $input) {
          ${TASK_FIELDS}
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async deleteTask(id: string) {
    const mutation = `
      mutation DeleteTask($id: ID!) {
        deleteNervousSystemTask(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }
}
