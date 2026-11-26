"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Tags,
  Ruler,
  Wallet,
  Truck,
  ListChecks,
  Users,
  Shield,
  Settings,
  Package,
  PackageMinus,
  Upload,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  LandPlot,
  Wrench,
  Trash2,
  FileBarChart,
  ClipboardList,
  Bot,
  Bell,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, PERMISSIONS, type PermissionCode } from "@/lib/rbac";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionCode;
  phase?: string;
};

const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "แดชบอร์ด",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
];

const masterNav: NavItem[] = [
  {
    href: "/master/departments",
    label: "หน่วยงาน",
    icon: Building2,
    permission: PERMISSIONS.MASTER_VIEW,
  },
  {
    href: "/master/locations",
    label: "สถานที่ตั้ง",
    icon: MapPin,
    permission: PERMISSIONS.MASTER_VIEW,
  },
  {
    href: "/master/categories",
    label: "หมวดครุภัณฑ์",
    icon: Tags,
    permission: PERMISSIONS.MASTER_VIEW,
  },
  {
    href: "/master/units",
    label: "หน่วยนับ",
    icon: Ruler,
    permission: PERMISSIONS.MASTER_VIEW,
  },
  {
    href: "/master/budget-sources",
    label: "แหล่งงบประมาณ",
    icon: Wallet,
    permission: PERMISSIONS.MASTER_VIEW,
  },
  {
    href: "/master/suppliers",
    label: "ผู้จำหน่าย",
    icon: Truck,
    permission: PERMISSIONS.MASTER_VIEW,
  },
  {
    href: "/master/asset-statuses",
    label: "สถานะครุภัณฑ์",
    icon: ListChecks,
    permission: PERMISSIONS.MASTER_VIEW,
  },
];

const assetNav: NavItem[] = [
  {
    href: "/assets",
    label: "ทะเบียนครุภัณฑ์",
    icon: Package,
    permission: PERMISSIONS.ASSETS_VIEW,
  },
  {
    href: "/assets/low-value",
    label: "ต่ำกว่าเกณฑ์",
    icon: PackageMinus,
    permission: PERMISSIONS.ASSETS_VIEW,
  },
  {
    href: "/assets/import",
    label: "นำเข้า Excel",
    icon: Upload,
    permission: PERMISSIONS.ASSETS_IMPORT,
  },
  {
    href: "/assets/sync-agent",
    label: "Sync Agent",
    icon: RefreshCw,
    permission: PERMISSIONS.ASSETS_IMPORT,
  },
];

const inventoryNav: NavItem[] = [
  {
    href: "/inventory",
    label: "ภาพรวมคลัง",
    icon: Boxes,
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
  {
    href: "/inventory/receipts",
    label: "รับเข้า",
    icon: ArrowDownToLine,
    permission: PERMISSIONS.INVENTORY_MANAGE,
  },
  {
    href: "/inventory/issues",
    label: "จ่ายออก",
    icon: ArrowUpFromLine,
    permission: PERMISSIONS.INVENTORY_MANAGE,
  },
  {
    href: "/inventory/ledger",
    label: "Stock Ledger",
    icon: ClipboardList,
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
  {
    href: "/inventory/reports",
    label: "รายงานสต็อก",
    icon: FileBarChart,
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
];

const lifecycleNav: NavItem[] = [
  {
    href: "/land",
    label: "ที่ดิน",
    icon: LandPlot,
    permission: PERMISSIONS.LAND_VIEW,
  },
  {
    href: "/maintenance",
    label: "ซ่อมบำรุง",
    icon: Wrench,
    permission: PERMISSIONS.MAINTENANCE_VIEW,
  },
  {
    href: "/transfers",
    label: "โอนย้าย",
    icon: ArrowRightLeft,
    permission: PERMISSIONS.ASSETS_MANAGE,
  },
  {
    href: "/disposals",
    label: "จำหน่าย",
    icon: Trash2,
    permission: PERMISSIONS.ASSETS_MANAGE,
  },
];

const inspectionNav: NavItem[] = [
  {
    href: "/inspection",
    label: "ตรวจประจำปี",
    icon: ClipboardList,
    permission: PERMISSIONS.ASSETS_VIEW,
  },
  {
    href: "/inspection/reports",
    label: "รายงานการตรวจ",
    icon: FileBarChart,
    permission: PERMISSIONS.ASSETS_VIEW,
  },
];

const reportNav: NavItem[] = [
  {
    href: "/reports",
    label: "ศูนย์รายงาน",
    icon: FileBarChart,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    href: "/notifications",
    label: "การแจ้งเตือน",
    icon: Bell,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    href: "/assistant",
    label: "AI Assistant",
    icon: Bot,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
];

const adminNav: NavItem[] = [
  {
    href: "/admin/users",
    label: "ผู้ใช้งาน",
    icon: Users,
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    href: "/admin/roles",
    label: "บทบาท / สิทธิ์",
    icon: Shield,
    permission: PERMISSIONS.ROLES_VIEW,
  },
  {
    href: "/admin/settings",
    label: "ตั้งค่าระบบ",
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
];

function NavSection({
  title,
  items,
  permissions,
}: {
  title: string;
  items: NavItem[];
  permissions: string[];
}) {
  const pathname = usePathname();
  const visible = items.filter(
    (item) =>
      !item.permission || hasPermission(permissions, item.permission),
  );

  if (visible.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-teal-200/70">
        {title}
      </p>
      <ul className="space-y-1">
        {visible.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-teal-800 text-white"
                    : "text-teal-50/90 hover:bg-teal-800/60 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.phase ? (
                  <span className="rounded bg-teal-900/60 px-1.5 py-0.5 text-[10px] text-teal-200">
                    {item.phase}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar({
  permissions,
}: {
  permissions: string[];
}) {
  return (
    <aside className="flex h-full w-64 flex-col bg-teal-900 text-white">
      <div className="border-b border-teal-800 px-4 py-5">
        <p className="text-xs font-medium text-teal-200">โรงพยาบาลทุ่งเสลี่ยม</p>
        <h1 className="mt-1 text-lg font-bold tracking-tight">TSL Smart Asset</h1>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <NavSection title="หลัก" items={mainNav} permissions={permissions} />
        <NavSection title="ครุภัณฑ์" items={assetNav} permissions={permissions} />
        <NavSection title="วัสดุคงคลัง" items={inventoryNav} permissions={permissions} />
        <NavSection title="วงจรชีวิตทรัพย์สิน" items={lifecycleNav} permissions={permissions} />
        <NavSection title="ตรวจ / QR" items={inspectionNav} permissions={permissions} />
        <NavSection title="รายงาน / ผู้ช่วย" items={reportNav} permissions={permissions} />
        <NavSection title="ข้อมูลหลัก" items={masterNav} permissions={permissions} />
        <NavSection title="ระบบ" items={adminNav} permissions={permissions} />
      </nav>
      <div className="border-t border-teal-800 px-4 py-3 text-xs text-teal-200/80">
        Phase 7 · Production Ready
      </div>
    </aside>
  );
}
