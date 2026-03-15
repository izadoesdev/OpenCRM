"use server";

import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { activity, lead, task } from "@/db/schema";
import { auth } from "@/lib/auth";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function exportLeads() {
  await getUser();
  return db
    .select({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      title: lead.title,
      phone: lead.phone,
      website: lead.website,
      country: lead.country,
      source: lead.source,
      status: lead.status,
      plan: lead.plan,
      value: lead.value,
      createdAt: lead.createdAt,
    })
    .from(lead)
    .orderBy(desc(lead.createdAt));
}

export async function exportTasks() {
  await getUser();
  return db
    .select({
      id: task.id,
      leadId: task.leadId,
      title: task.title,
      description: task.description,
      type: task.type,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      recurrence: task.recurrence,
      createdAt: task.createdAt,
    })
    .from(task)
    .orderBy(desc(task.createdAt));
}

export async function exportActivities() {
  await getUser();
  return db
    .select({
      id: activity.id,
      leadId: activity.leadId,
      type: activity.type,
      content: activity.content,
      createdAt: activity.createdAt,
    })
    .from(activity)
    .orderBy(desc(activity.createdAt));
}
