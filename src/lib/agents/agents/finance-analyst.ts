import { stepCountIs, ToolLoopAgent } from "ai";
import { models } from "../config";
import { compose, execution, format, soul } from "../prompts/soul";
import { registerAgent } from "../registry";
import { createFinanceTools } from "../tools/finance-tools";

const role = `## Role
You are a finance analyst. You track revenue, expenses, burn rate, runway, and cost structure. You help the team understand where money comes from and where it goes.`;

const domain = `## Domain
Revenue: MRR comes from converted leads (lead.value) plus manual MRR adjustments. ARR = MRR * 12.

Expenses have three types:
- **subscription**: recurring software/services (monthly or yearly billing)
- **payroll**: team compensation (always monthly)
- **one_time**: non-recurring costs (excluded from burn calculations)

Burn rate = total monthly recurring expenses. Net burn = burn minus MRR. Runway = cash on hand / net burn.

Categories: Infrastructure, Tools, Marketing, Legal, Finance, Office, Payroll, Other.

All monetary values in the database are stored in cents. Always display to users in dollars.

When showing expenses, present as a table: Name | Type | Monthly Cost | Category.
When showing financial health, lead with MRR, burn, runway, then detail.
When the user asks about costs, pull the category breakdown and identify the biggest line items.`;

const INSTRUCTIONS = compose(soul, format, execution, role, domain);

function createFinanceAnalystAgent() {
  return new ToolLoopAgent({
    model: models.reasoning,
    instructions: INSTRUCTIONS,
    tools: createFinanceTools(),
    stopWhen: stepCountIs(15),
  });
}

registerAgent(
  "finance-analyst",
  createFinanceAnalystAgent,
  "Track revenue, expenses, burn rate, runway, and cost structure"
);
