import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AuthSessionUser = {
  id: string;
  name: string;
  email?: string;
  username: string;
  roles: string[];
  permissions: string[];
  departmentId: string | null;
  departmentName: string | null;
};

function defaultRoleCode() {
  const code = (process.env.HOSXP_DEFAULT_ROLE || "VIEWER").trim().toUpperCase();
  return code || "VIEWER";
}

async function loadUserForSession(userId: string): Promise<AuthSessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
      department: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;

  const roles = user.userRoles.map((ur) => ur.role.code);
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const permissions = isSuperAdmin
    ? ["*"]
    : [
        ...new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => rp.permission.code),
          ),
        ),
      ];

  return {
    id: user.id,
    name: user.fullName,
    email: user.email ?? undefined,
    username: user.username,
    roles,
    permissions,
    departmentId: user.departmentId,
    departmentName: user.department?.name ?? null,
  };
}

/**
 * Find or create local Asset user after HOSxP credential success.
 * Local RBAC stays in tsl_asset; password continues to be verified via HOSxP.
 */
export async function ensureLocalUserFromHosxp(input: {
  username: string;
  displayName?: string;
}): Promise<AuthSessionUser | null> {
  const username = input.username.trim();
  if (!username) return null;

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true, fullName: true, status: true },
  });

  if (existing) {
    if (existing.status !== "ACTIVE") return null;
    if (input.displayName && input.displayName !== existing.fullName) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { fullName: input.displayName },
      });
    }
    return loadUserForSession(existing.id);
  }

  const roleCode = defaultRoleCode();
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    throw new Error(`ไม่พบบทบาทเริ่มต้น ${roleCode} สำหรับผู้ใช้จาก ERP`);
  }

  // Unusable local hash — authentication is via HOSxP opduser
  const passwordHash = await hash(randomBytes(32).toString("hex"), 12);

  const created = await prisma.user.create({
    data: {
      username,
      fullName: input.displayName?.trim() || username,
      passwordHash,
      status: "ACTIVE",
      userRoles: {
        create: [{ roleId: role.id }],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: created.id,
      action: "USER_PROVISION_HOSXP",
      entity: "User",
      entityId: created.id,
      detail: `สร้างผู้ใช้จาก ERP/HOSxP (${username}) บทบาท ${roleCode}`,
    },
  });

  return loadUserForSession(created.id);
}

export async function loadLocalUserByUsername(
  username: string,
): Promise<
  | (AuthSessionUser & {
      passwordHash: string;
      status: string;
      dbId: string;
    })
  | null
> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
      department: true,
    },
  });
  if (!user) return null;

  const roles = user.userRoles.map((ur) => ur.role.code);
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const permissions = isSuperAdmin
    ? ["*"]
    : [
        ...new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => rp.permission.code),
          ),
        ),
      ];

  return {
    id: user.id,
    dbId: user.id,
    name: user.fullName,
    email: user.email ?? undefined,
    username: user.username,
    roles,
    permissions,
    departmentId: user.departmentId,
    departmentName: user.department?.name ?? null,
    passwordHash: user.passwordHash,
    status: user.status,
  };
}
