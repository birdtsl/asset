import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    orderBy: [{ code: "asc" }],
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      _count: { select: { userRoles: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="บทบาทและสิทธิ์ (RBAC)"
        description="กำหนดสิทธิ์การเข้าถึงตามบทบาท"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{role.name}</CardTitle>
                <Badge variant={role.isSystem ? "default" : "secondary"}>
                  {role.code}
                </Badge>
              </div>
              <CardDescription>
                {role.description ?? "ไม่มีคำอธิบาย"} · ผู้ใช้{" "}
                {role._count.userRoles} คน
              </CardDescription>
            </CardHeader>
            <CardContent>
              {role.code === "SUPER_ADMIN" ? (
                <Badge variant="success">สิทธิ์ทั้งหมด (*)</Badge>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {role.rolePermissions.length === 0 ? (
                    <span className="text-sm text-slate-500">ไม่มีสิทธิ์</span>
                  ) : (
                    role.rolePermissions.map((rp) => (
                      <Badge key={rp.permissionId} variant="outline">
                        {rp.permission.code}
                      </Badge>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
