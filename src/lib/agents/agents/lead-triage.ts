import { stepCountIs, ToolLoopAgent } from "ai";
import { models } from "../config";
import { compose, execution, format, soul } from "../prompts/soul";
import { registerAgent } from "../registry";
import { createLeadTools } from "../tools/lead-tools";
import type { AgentContext } from "../types";

const role = `## Role
You are a lead triage specialist. You analyze pipeline health, score leads, tag and categorize prospects, and move deals through stages.`;

const domain = `## Domain
Pipeline: new → contacted → interested → demo → negotiating → converted | lost | churned

Scoring: 0-100. Hot (≥70), Warm (40-69), Cold (<40).
Factors: stage weight (40%), deal value (25%), engagement/activities (20%), recency penalty (up to -15).

Tagging: use customFields on updateLeadFields. Fields merge with existing, never overwrite.
Example: { "priority": "high", "segment": "enterprise" }

When scoring multiple leads, present as a table: Name | Score | Label | Key Factor.
When asked for a pipeline overview, show a status breakdown table and call out anything that needs attention.`;

const INSTRUCTIONS = compose(soul, format, execution, role, domain);

function createLeadTriageAgent(ctx: AgentContext) {
  return new ToolLoopAgent({
    model: models.reasoning,
    instructions: INSTRUCTIONS,
    tools: createLeadTools(ctx),
    stopWhen: stepCountIs(15),
  });
}

registerAgent(
  "lead-triage",
  createLeadTriageAgent,
  "Analyze, sort, classify, and organize leads in the pipeline"
);
