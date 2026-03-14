import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/db";
import { activity, lead } from "@/db/schema";
import { validateApiKey } from "@/lib/actions/api-keys";
import { LEAD_SOURCES } from "@/lib/constants";

const createLeadSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.email("invalid email"),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  website: z.url("invalid URL").optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  status: z.string().optional(),
  value: z.number().int().min(0).optional(),
  customFields: z.record(z.string(), z.string()).optional(),
});

function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");
  const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : xApiKey;

  if (!raw) {
    return null;
  }
  return validateApiKey(raw);
}

export async function POST(req: Request) {
  const key = await authenticate(req);
  if (!key) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const [row] = await db
    .insert(lead)
    .values({
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      title: data.title ?? null,
      phone: data.phone ?? null,
      website: data.website ?? null,
      source: data.source ?? "api",
      status: data.status ?? "new",
      value: data.value ?? 0,
      customFields: data.customFields ?? {},
      assignedTo: key.createdBy,
    })
    .returning();

  await db.insert(activity).values({
    leadId: row.id,
    userId: key.createdBy,
    type: "status_change",
    content: `Lead created via API (key: ${key.prefix}…)`,
    metadata: { newStatus: "new", apiKeyId: key.id },
  });

  return NextResponse.json(
    {
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company,
      status: row.status,
      source: row.source,
      createdAt: row.createdAt,
    },
    { status: 201 }
  );
}
