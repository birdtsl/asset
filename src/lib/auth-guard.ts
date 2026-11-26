import { auth } from "@/lib/auth";
import {
  hasPermission,
  type PermissionCode,
} from "@/lib/rbac";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session.user;
}

export async function requirePermission(permission: PermissionCode) {
  const user = await requireUser();
  if (!hasPermission(user.permissions, permission)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
