import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeTH } from "@/lib/utils";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ username: "asc" }],
    include: {
      department: { select: { name: true } },
      userRoles: { include: { role: { select: { code: true, name: true } } } },
    },
  });

  return (
    <div>
      <PageHeader
        title="ผู้ใช้งาน"
        description="บัญชีผู้ใช้และบทบาทในระบบ"
      />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ชื่อ-นามสกุล
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                หน่วยงาน
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                บทบาท
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                สถานะ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Login ล่าสุด
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {u.username}
                </td>
                <td className="px-4 py-3 text-slate-800">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-700">
                  {u.department?.name ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.userRoles.map((ur) => (
                      <Badge key={ur.role.code} variant="secondary">
                        {ur.role.code}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={u.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTimeTH(u.lastLoginAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
