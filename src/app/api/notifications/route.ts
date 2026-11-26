import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import {
  listNotifications,
  markAllNotificationsRead,
  unreadNotificationCount,
} from "@/lib/notifications/notification-service";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
    const [items, unread] = await Promise.all([
      listNotifications(40),
      unreadNotificationCount(),
    ]);
    return NextResponse.json({ data: { items, unread } });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
    await markAllNotificationsRead();
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
