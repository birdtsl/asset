export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",
  MASTER_VIEW: "master.view",
  MASTER_MANAGE: "master.manage",
  ASSETS_VIEW: "assets.view",
  ASSETS_MANAGE: "assets.manage",
  ASSETS_IMPORT: "assets.import",
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",
  LAND_VIEW: "land.view",
  LAND_MANAGE: "land.manage",
  MAINTENANCE_VIEW: "maintenance.view",
  MAINTENANCE_MANAGE: "maintenance.manage",
  REPORTS_VIEW: "reports.view",
  SETTINGS_MANAGE: "settings.manage",
  AUDIT_VIEW: "audit.view",
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_CODES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  ASSET_OFFICER: "ASSET_OFFICER",
  WAREHOUSE: "WAREHOUSE",
  DEPARTMENT_USER: "DEPARTMENT_USER",
  VIEWER: "VIEWER",
  EXECUTIVE: "EXECUTIVE",
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: PermissionCode | PermissionCode[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes("*")) return true;
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(
  userPermissions: string[] | undefined | null,
  required: PermissionCode[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes("*")) return true;
  return required.some((p) => userPermissions.includes(p));
}

export function hasRole(
  userRoles: string[] | undefined | null,
  required: RoleCode | RoleCode[],
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((r) => userRoles.includes(r));
}
