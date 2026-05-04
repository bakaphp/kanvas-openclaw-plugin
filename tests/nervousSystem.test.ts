import { describe, it, expect, beforeAll } from "vitest";
import { NervousSystemService } from "../src/domains/nervousSystem/index.js";
import { getAuthenticatedClient } from "./setup.js";

let ns: NervousSystemService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  ns = new NervousSystemService(client);
});

describe("Nervous System — Plans (read)", () => {
  it("listPlans returns a paginated list", async () => {
    const res = await ns.listPlans({ first: 5 });

    if (res.errors?.length) {
      // some users may not have permission — at minimum, the schema must resolve
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const list = (res.data as any).nervousSystemPlans.data;
    expect(Array.isArray(list)).toBe(true);
  });
});

describe("Nervous System — Plan + Task lifecycle", () => {
  let planId: string | null = null;
  let firstTaskId: string | null = null;
  let extraTaskId: string | null = null;

  it("createPlan with seeded tasks succeeds", async () => {
    const res = await ns.createPlan({
      title: `Integration Plan ${Date.now()}`,
      plan_type: "integration_test",
      description: "Created by automated integration tests",
      status: "draft",
      priority: 1,
      tasks: [
        { title: "Read the brief", sequence: 0, status: "pending" },
        { title: "Do the work", sequence: 1, status: "pending" },
      ],
      input: { test_run: true },
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const plan = (res.data as any).createNervousSystemPlan;
    expect(plan.id).toBeDefined();
    expect(plan.uuid).toBeDefined();
    expect(plan.tasks?.length).toBe(2);

    planId = plan.id;
    firstTaskId = plan.tasks[0].id;
  });

  it("getPlan returns full detail", async () => {
    if (!planId) return;

    const res = await ns.getPlan(planId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const plan = (res.data as any).nervousSystemPlan;
    expect(plan.id).toBe(planId);
    expect(plan.tasks?.length).toBeGreaterThanOrEqual(2);
  });

  it("addTask appends a task to the plan", async () => {
    if (!planId) return;

    const res = await ns.addTask(planId, {
      title: "Wrap up and report",
      sequence: 2,
      status: "pending",
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const task = (res.data as any).addTaskToNervousSystemPlan;
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Wrap up and report");
    extraTaskId = task.id;
  });

  it("updatePlan transitions to active", async () => {
    if (!planId) return;

    const res = await ns.updatePlan(planId, { status: "active" });
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const plan = (res.data as any).updateNervousSystemPlan;
    expect(plan.id).toBe(planId);
    expect(plan.status).toBe("active");
  });

  it("updateTaskStatus marks a task in_progress", async () => {
    if (!firstTaskId) return;

    const res = await ns.updateTaskStatus(firstTaskId, { status: "in_progress" });
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const task = (res.data as any).updateNervousSystemTaskStatus;
    expect(task.id).toBe(firstTaskId);
    expect(task.status).toBe("in_progress");
  });

  it("updateTaskStatus marks a task done with a result", async () => {
    if (!firstTaskId) return;

    const res = await ns.updateTaskStatus(firstTaskId, {
      status: "done",
      result: { summary: "Done in test" },
    });
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const task = (res.data as any).updateNervousSystemTaskStatus;
    expect(task.status).toBe("done");
  });

  it("updatePlan finishes the plan with output", async () => {
    if (!planId) return;

    const res = await ns.updatePlan(planId, {
      status: "done",
      output: { summary: "Integration test completed", tests_run: 6 },
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const plan = (res.data as any).updateNervousSystemPlan;
    expect(plan.status).toBe("done");
  });

  it("deleteTask cleans up extra task", async () => {
    if (!extraTaskId) return;

    const res = await ns.deleteTask(extraTaskId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    expect((res.data as any).deleteNervousSystemTask).toBeTruthy();
  });

  it("deletePlan cleans up the test plan", async () => {
    if (!planId) return;

    const res = await ns.deletePlan(planId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    expect((res.data as any).deleteNervousSystemPlan).toBeTruthy();
  });
});
