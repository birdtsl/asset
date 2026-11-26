import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/lifecycle/action-button";
import { InspectForm } from "@/components/inspection/inspect-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTH, formatDateTimeTH } from "@/lib/utils";

export default async function InspectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string; q?: string }>;
}) {
  const { id } = await params;
  const { result, q } = await searchParams;
  const query = q?.trim() || "";

  const campaign = await prisma.inspectionCampaign.findUnique({
    where: { id },
  });
  if (!campaign) notFound();

  const [summary, items] = await Promise.all([
    prisma.inspectionItem.groupBy({
      by: ["result"],
      where: { campaignId: id },
      _count: { _all: true },
    }),
    prisma.inspectionItem.findMany({
      where: {
        campaignId: id,
        ...(result ? { result: result as never } : {}),
        ...(query
          ? {
              asset: {
                OR: [
                  { assetCode: { contains: query } },
                  { itemName: { contains: query } },
                  { locationText: { contains: query } },
                ],
              },
            }
          : {}),
      },
      include: {
        asset: {
          select: {
            assetCode: true,
            itemName: true,
            locationText: true,
            qrToken: true,
          },
        },
      },
      orderBy: [{ result: "asc" }, { updatedAt: "desc" }],
      take: 40,
    }),
  ]);

  const countMap = Object.fromEntries(
    summary.map((s) => [s.result, s._count._all]),
  );
  const total = summary.reduce((n, s) => n + s._count._all, 0);
  const done = total - (countMap.PENDING || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.title}
        description={`ปี ${campaign.yearBe} · ${formatDateTH(campaign.startDate)}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/inspection/reports?campaignId=${campaign.id}`}>
                รายงาน
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/inspection">กลับ</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={campaign.status === "CLOSED" ? "secondary" : "success"}>
          {campaign.status}
        </Badge>
        <span className="text-sm text-slate-600">
          ตรวจแล้ว {done.toLocaleString("th-TH")} / {total.toLocaleString("th-TH")}
        </span>
        {campaign.status !== "CLOSED" ? (
          <ActionButton
            endpoint={`/api/inspection/campaigns/${campaign.id}/close`}
            label="ปิดรอบตรวจ"
            confirmText="ยืนยันปิดรอบตรวจประจำปี?"
          />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {["PENDING", "PASS", "REPAIR_NEEDED", "FAIL", "MISSING", "DISPOSED"].map(
          (key) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-500">{key}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {(countMap[key] || 0).toLocaleString("th-TH")}
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="ค้นหารหัส / ชื่อ / สถานที่"
          className="h-10 min-w-[220px] flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
        />
        <select
          name="result"
          defaultValue={result || ""}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">ทุกผลตรวจ</option>
          <option value="PENDING">PENDING</option>
          <option value="PASS">PASS</option>
          <option value="REPAIR_NEEDED">REPAIR_NEEDED</option>
          <option value="FAIL">FAIL</option>
          <option value="MISSING">MISSING</option>
          <option value="DISPOSED">DISPOSED</option>
        </select>
        <Button type="submit" variant="secondary">
          กรอง
        </Button>
      </form>

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            ไม่พบรายการตามเงื่อนไข
          </p>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {item.asset.assetCode}
                    </CardTitle>
                    <p className="text-sm text-slate-600">{item.asset.itemName}</p>
                    <p className="text-xs text-slate-500">
                      {item.asset.locationText ?? "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        item.result === "PASS"
                          ? "success"
                          : item.result === "PENDING"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {item.result}
                    </Badge>
                    {item.inspectedAt ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTimeTH(item.inspectedAt)}
                      </p>
                    ) : null}
                    {item.asset.qrToken ? (
                      <Link
                        href={`/q/${item.asset.qrToken}`}
                        className="mt-1 block text-xs text-teal-700 hover:underline"
                        target="_blank"
                      >
                        เปิดบัตร QR
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {campaign.status === "CLOSED" ? (
                  <p className="text-sm text-slate-500">
                    {item.conditionNote || item.locationFound || "รอบตรวจปิดแล้ว"}
                  </p>
                ) : (
                  <InspectForm
                    itemId={item.id}
                    defaultResult={item.result === "PENDING" ? "PASS" : item.result}
                    defaultLocation={item.locationFound || item.asset.locationText || ""}
                    defaultNote={item.conditionNote || ""}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
