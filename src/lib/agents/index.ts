/* biome-ignore-all lint/performance/noBarrelFile: agent system entry point */

export { createTriageAgent } from "./agents/triage";
export { models } from "./config";
export { getAgent, listAgents, registerAgent } from "./registry";
export { createLeadTools } from "./tools/lead-tools";

import "./agents/lead-triage";
import "./agents/finance-analyst";
