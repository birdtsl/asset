import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl, buildAssetQrUrl } from "@/lib/inspection/qr";
import { Badge } from "@/components/ui/badge";
import { formatDateTH } from "@/lib/utils";

export default async function PublicAssetQrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const asset = await prisma.asset.findUnique({
    where: { qrToken: token },
    include: { status: true },
  });
  if (!asset) notFound();

  const url = buildAssetQrUrl(token);
  const qrDataUrl = await generateQrDataUrl(url);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          TSL Smart Asset
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{asset.itemName}</h1>
        <p className="mt-1 font-mono text-sm text-slate-600">{asset.assetCode}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {asset.assetClass === "LOW_VALUE" ? "ต่ำกว่าเกณฑ์" : "ครุภัณฑ์"}
          </Badge>
          <Badge variant={asset.isActive ? "success" : "warning"}>
            {asset.status?.name ?? (asset.isActive ? "ใช้งาน" : "ปิดใช้งาน")}
          </Badge>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">ประเภท</dt>
            <dd className="font-medium text-slate-900">{asset.categoryName ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">สถานที่ตั้ง / ผู้รับผิดชอบ</dt>
            <dd className="font-medium text-slate-900">{asset.locationText ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">วันที่ได้มา</dt>
            <dd className="font-medium text-slate-900">{formatDateTH(asset.receivedAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">ราคาต่อหน่วย</dt>
            <dd className="font-medium text-slate-900">
              {asset.unitPrice
                ? Number(asset.unitPrice).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={`QR ${asset.assetCode}`} className="h-48 w-48" />
          <p className="text-xs text-slate-500">สแกนเพื่อเปิดบัตรครุภัณฑ์</p>
        </div>
      </div>
    </div>
  );
}
