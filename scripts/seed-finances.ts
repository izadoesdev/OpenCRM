/**
 * Seed finances with initial expenses from spreadsheet.
 * Run: bun run seed-finances
 * Does NOT modify cash or MRR adjustment.
 */
import "dotenv/config";
import { db } from "../src/db";
import { expense } from "../src/db/schema";

const EXPENSES = [
  {
    name: "Hetzner",
    amountCents: 8000,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "infrastructure",
  },
  {
    name: "FrogDR",
    amountCents: 500,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "tools",
  },
  {
    name: "Cloudflare",
    amountCents: 500,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "infrastructure",
  },
  {
    name: "Payroll",
    amountCents: 1_000_000,
    type: "payroll" as const,
    billingPeriod: "monthly" as const,
    category: "payroll",
  },
  {
    name: "Cursor",
    amountCents: 20_000,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "tools",
  },
  {
    name: "Legalinc",
    amountCents: 800,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "legal",
  },
  {
    name: "GitHub Sponsors",
    amountCents: 7500,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "tools",
  },
  {
    name: "BunnyCDN",
    amountCents: 1000,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "infrastructure",
  },
  {
    name: "Slack",
    amountCents: 875,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "tools",
  },
  {
    name: "Puzzle",
    amountCents: 2500,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "legal",
  },
  {
    name: "Fondo",
    amountCents: 30_000,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "finance",
  },
  {
    name: "Regus",
    amountCents: 24_000,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "office",
  },
  {
    name: "Google Ads",
    amountCents: 150_000,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "marketing",
  },
  {
    name: "LinkedIn SalesNav",
    amountCents: 12_792,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    category: "marketing",
  },
];

async function main() {
  console.log("Seeding finances...");

  // Insert expenses (skip if name already exists to avoid dupes)
  const existingNames = new Set(
    (await db.select({ name: expense.name }).from(expense)).map((r) => r.name)
  );

  let added = 0;
  for (const e of EXPENSES) {
    if (existingNames.has(e.name)) {
      console.log(`  Skip (exists): ${e.name}`);
      continue;
    }
    await db.insert(expense).values({
      name: e.name,
      type: e.type,
      amountCents: e.amountCents,
      billingPeriod: e.billingPeriod,
      category: e.category,
    });
    console.log(`  + ${e.name} $${(e.amountCents / 100).toLocaleString()}/mo`);
    added++;
  }

  console.log(`Done. ${added} expenses added.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
