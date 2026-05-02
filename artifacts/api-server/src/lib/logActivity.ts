import { db } from "@workspace/db";
import { activityLogsTable } from "@workspace/db/schema/activity_logs";
import type { Request } from "express";

export interface LogActivityParams {
  businessId?: number | null;
  userId?: number | null;
  userName: string;
  userRole: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams, req?: Request): Promise<void> {
  try {
    await db.insert(activityLogsTable).values({
      businessId:  params.businessId  ?? null,
      userId:      params.userId      ?? null,
      userName:    params.userName,
      userRole:    params.userRole,
      action:      params.action,
      entityType:  params.entityType  ?? null,
      entityId:    params.entityId    ?? null,
      description: params.description,
      metadata:    params.metadata    ?? null,
      ipAddress:   req?.ip            ?? null,
    });
  } catch {
    // Ne jamais lever — le logging ne doit pas casser le flux principal
  }
}

export async function logFromRequest(
  req: Request,
  params: Omit<LogActivityParams, "userId" | "userName" | "userRole">,
): Promise<void> {
  const session = (req.session as any);
  await logActivity({
    ...params,
    userId:   session?.userId   ?? null,
    userName: session?.userName ?? "Inconnu",
    userRole: session?.userRole ?? "STAFF",
  }, req);
}
