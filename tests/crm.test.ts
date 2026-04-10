import { describe, it, expect, beforeAll } from "vitest";
import { CrmService } from "../src/domains/crm/index.js";
import { getAuthenticatedClient } from "./setup.js";

let crm: CrmService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  crm = new CrmService(client);
});

describe("CRM — Leads", () => {
  let createdLeadId: string;
  let pipelineStageId: number;

  it("listPipelines returns data", async () => {
    const res = await crm.listPipelines();
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const pipelines = (res.data as any).pipelines.data;
    expect(Array.isArray(pipelines)).toBe(true);
    expect(pipelines.length).toBeGreaterThan(0);

    // grab a stage id for lead creation
    const firstPipeline = pipelines[0];
    expect(firstPipeline.stages).toBeDefined();
    pipelineStageId = Number(firstPipeline.stages[0].id);
  });

  it("searchLeads returns paginated results", async () => {
    const res = await crm.searchLeads("test", 5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const leads = (res.data as any).leads.data;
    expect(Array.isArray(leads)).toBe(true);
  });

  it("createLead succeeds", async () => {
    const res = await crm.createLead({
      title: `Integration Test Lead ${Date.now()}`,
      pipeline_stage_id: pipelineStageId,
      people: {
        firstname: "Test",
        lastname: "Integration",
      },
    });
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const lead = (res.data as any).createLead;
    expect(lead.id).toBeDefined();
    expect(lead.uuid).toBeDefined();
    createdLeadId = lead.id;
  });

  it("getLead returns full details", async () => {
    const res = await crm.getLead(createdLeadId);
    expect(res.errors).toBeFalsy();

    const leads = (res.data as any).leads.data;
    expect(leads.length).toBe(1);
    expect(leads[0].id).toBe(createdLeadId);
  });

  it("updateLead modifies fields", async () => {
    const res = await crm.updateLead(createdLeadId, {
      description: "Updated by integration test",
    });
    expect(res.errors).toBeFalsy();

    const lead = (res.data as any).updateLead;
    expect(lead.description).toBe("Updated by integration test");
  });

  it("deleteLead soft-deletes", async () => {
    const res = await crm.deleteLead(createdLeadId);
    expect(res.errors).toBeFalsy();
    expect((res.data as any).deleteLead).toBeTruthy();
  });

  it("restoreLead recovers deleted lead", async () => {
    const res = await crm.restoreLead(createdLeadId);
    expect(res.errors).toBeFalsy();
    expect((res.data as any).restoreLead).toBeTruthy();
  });

  // Clean up: permanently delete
  it("deleteLead cleans up test lead", async () => {
    await crm.deleteLead(createdLeadId);
  });
});

describe("CRM — Lead Messages", () => {
  let leadId: string;
  let channelSlug: string;
  let pipelineStageId: number;

  beforeAll(async () => {
    // Create a lead to test messages on
    const pipelines = await crm.listPipelines();
    const firstPipeline = (pipelines.data as any).pipelines.data[0];
    pipelineStageId = Number(firstPipeline.stages[0].id);

    const res = await crm.createLead({
      title: `Msg Test Lead ${Date.now()}`,
      pipeline_stage_id: pipelineStageId,
      people: { firstname: "Msg", lastname: "Test" },
    });
    leadId = (res.data as any).createLead.id;

    // Get the channel slug for this lead
    channelSlug = await crm.getLeadPrimaryChannelSlug(leadId);
  });

  it("addLeadMessage creates a message", async () => {
    const res = await crm.addLeadMessage({
      channel_slug: channelSlug,
      message: "Integration test message",
    });
    expect(res.errors).toBeFalsy();
    expect((res.data as any).createMessage).toBeDefined();
  });

  it("listLeadMessages returns messages for the channel", async () => {
    const res = await crm.listLeadMessages(channelSlug, 10);
    expect(res.errors).toBeFalsy();

    const messages = (res.data as any).messages.data;
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].message).toBeDefined();
  });

  it("addLeadMessageByLeadId creates a message via lead ID", async () => {
    const res = await crm.addLeadMessageByLeadId({
      leadId,
      message: "Message via lead ID",
    });
    expect(res.errors).toBeFalsy();
    expect((res.data as any).createMessage).toBeDefined();
  });

  // Clean up
  afterAll(async () => {
    await crm.deleteLead(leadId);
  });
});

describe("CRM — Pipelines CRUD", () => {
  let pipelineId: string;
  let stageId: string;

  it("createPipeline succeeds", async () => {
    const res = await crm.createPipeline({
      name: `Test Pipeline ${Date.now()}`,
      weight: 99,
      is_default: false,
    });
    expect(res.errors).toBeFalsy();

    const pipeline = (res.data as any).createPipeline;
    expect(pipeline.id).toBeDefined();
    pipelineId = pipeline.id;
  });

  it("createPipelineStage succeeds", async () => {
    const res = await crm.createPipelineStage({
      pipeline_id: pipelineId,
      name: `Test Stage ${Date.now()}`,
      weight: 1,
      rotting_days: 0,
    });
    expect(res.errors).toBeFalsy();

    const stage = (res.data as any).createPipelineStage;
    expect(stage.id).toBeDefined();
    stageId = stage.id;
  });

  it("updatePipelineStage succeeds", async () => {
    const res = await crm.updatePipelineStage(stageId, {
      name: `Updated Stage ${Date.now()}`,
      weight: 2,
      rotting_days: 0,
      pipeline_id: pipelineId,
    });
    expect(res.errors).toBeFalsy();
  });

  it("deletePipelineStage succeeds", async () => {
    const res = await crm.deletePipelineStage(stageId);
    expect(res.errors).toBeFalsy();
  });

  it("deletePipeline cleans up", async () => {
    const res = await crm.deletePipeline(pipelineId);
    expect(res.errors).toBeFalsy();
  });
});

describe("CRM — Lookups", () => {
  it("listLeadStatuses returns data", async () => {
    const res = await crm.listLeadStatuses();
    expect(res.errors).toBeFalsy();
    const statuses = (res.data as any).leadStatuses.data;
    expect(Array.isArray(statuses)).toBe(true);
  });

  it("listLeadSources returns data", async () => {
    const res = await crm.listLeadSources();
    expect(res.errors).toBeFalsy();
    const sources = (res.data as any).leadSources.data;
    expect(Array.isArray(sources)).toBe(true);
  });

  it("listLeadTypes returns data", async () => {
    const res = await crm.listLeadTypes();
    expect(res.errors).toBeFalsy();
    const types = (res.data as any).leadTypes.data;
    expect(Array.isArray(types)).toBe(true);
  });

  it("searchPeople returns results", async () => {
    const res = await crm.searchPeople("test", 5);
    expect(res.errors).toBeFalsy();
    const people = (res.data as any).peoples.data;
    expect(Array.isArray(people)).toBe(true);
  });
});

// Need afterAll import
import { afterAll } from "vitest";
