import { prisma } from "@/lib/prisma";
import { getExecutiveKpis } from "@/lib/reports/executive-kpis";

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["นำเข้า", "import", "excel", "xlsm"],
    answer:
      "นำเข้าครุภัณฑ์ได้ที่เมนู ครุภัณฑ์ → นำเข้า Excel เลือกไฟล์ .xlsm/.xlsx แล้ว Validate → Preview → Commit โดยไม่เขียนทับทะเบียนโดยตรงจนกว่าจะยืนยัน",
  },
  {
    keywords: ["qr", "คิวอาร์", "สแกน"],
    answer:
      "สร้าง QR ได้จากหน้ารายละเอียดครุภัณฑ์ หรือที่เมนู ตรวจประจำปี กดสร้าง QR แบบชุด หน้าสาธารณะอยู่ที่ /q/[token] โดยไม่ต้องล็อกอิน",
  },
  {
    keywords: ["ตรวจ", "ประจำปี", "inspection"],
    answer:
      "สร้างรอบตรวจที่ ตรวจประจำปี → สร้างรอบตรวจ จากนั้นบันทึกผลเป็น PASS / FAIL / REPAIR_NEEDED / MISSING / DISPOSED และดูสรุปที่รายงานการตรวจ",
  },
  {
    keywords: ["รับเข้า", "receipt", "จ่าย", "issue", "สต็อก", "วัสดุ"],
    answer:
      "วัสดุคงคลัง: สร้างใบรับเข้า/จ่ายออกเป็น DRAFT แล้ว Post เพื่ออัปเดตยอดและเฉลี่ยต้นทุน ดูความเคลื่อนไหวได้ที่ Ledger และรายงานคลัง",
  },
  {
    keywords: ["โอน", "transfer", "จำหน่าย", "disposal", "ซ่อม", "maintenance"],
    answer:
      "วงจรชีวิต: ซ่อมบำรุง / โอนย้าย / จำหน่าย อยู่ในเมนูวงจรชีวิตทรัพย์สิน สถานะ DRAFT → APPROVED/COMPLETE ตามเอกสาร",
  },
  {
    keywords: ["ที่ดิน", "land"],
    answer:
      "ทะเบียนที่ดินอยู่ที่เมนู ที่ดิน แสดงแปลง เนื้อที่ มูลค่า และรายละเอียดจากข้อมูลที่นำเข้าแล้ว",
  },
  {
    keywords: ["สิทธิ์", "role", "rbac", "ผู้ใช้"],
    answer:
      "จัดการผู้ใช้และบทบาทได้ที่ระบบ → ผู้ใช้งาน / บทบาท-สิทธิ์ โดย SUPER_ADMIN มีสิทธิ์เต็ม",
  },
];

function matchFaq(question: string) {
  const q = question.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some((k) => q.includes(k.toLowerCase()))) {
      return item.answer;
    }
  }
  return null;
}

export async function askSystemAssistant(question: string) {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: "พิมพ์คำถามเกี่ยวกับการใช้งาน TSL Smart Asset ได้เลย เช่น จำนวนครุภัณฑ์, วิธีสร้าง QR, หรือสต็อกต่ำ",
      source: "empty" as const,
    };
  }

  const q = trimmed.toLowerCase();
  const kpis = await getExecutiveKpis();

  if (
    q.includes("กี่") ||
    q.includes("จำนวน") ||
    q.includes("สรุป") ||
    q.includes("kpi") ||
    q.includes("dashboard") ||
    q.includes("แดชบอร์ด")
  ) {
    return {
      answer: [
        "สรุปตัวเลขจากฐานข้อมูลจริง ณ ขณะนี้:",
        `• ครุภัณฑ์ปกติ: ${kpis.normalAssets.toLocaleString("th-TH")} รายการ`,
        `• ต่ำกว่าเกณฑ์: ${kpis.lowValueAssets.toLocaleString("th-TH")} รายการ`,
        `• ที่ดิน: ${kpis.landParcels.toLocaleString("th-TH")} แปลง`,
        `• วัสดุ: ${kpis.materials.toLocaleString("th-TH")} รายการ`,
        `• มูลค่าสต็อกโดยประมาณ: ${kpis.stockValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`,
        `• สต็อกต่ำกว่าเกณฑ์: ${kpis.lowStockCount.toLocaleString("th-TH")} รายการ`,
        `• ค้างตรวจประจำปี: ${kpis.openInspectionPending.toLocaleString("th-TH")} รายการ`,
        `• งานซ่อมเปิดอยู่: ${kpis.openMaintenance.toLocaleString("th-TH")} ใบ`,
        `• QR พร้อมใช้: ${kpis.qrReady.toLocaleString("th-TH")} รายการ`,
      ].join("\n"),
      source: "kpi" as const,
    };
  }

  if (q.includes("หา") || q.includes("ค้น") || q.includes("รหัส")) {
    const codeMatch = trimmed.match(/[0-9]{3,}-[0-9A-Za-z./\s-]{3,}/);
    if (codeMatch) {
      const asset = await prisma.asset.findFirst({
        where: { assetCode: { contains: codeMatch[0].trim() } },
        select: {
          id: true,
          assetCode: true,
          itemName: true,
          locationText: true,
          assetClass: true,
        },
      });
      if (asset) {
        return {
          answer: `พบครุภัณฑ์ ${asset.assetCode}\nชื่อ: ${asset.itemName}\nสถานที่: ${asset.locationText ?? "-"}\nเปิดดูได้ที่ /assets/${asset.id}`,
          source: "asset_lookup" as const,
        };
      }
    }
  }

  const faq = matchFaq(trimmed);
  if (faq) {
    return { answer: faq, source: "faq" as const };
  }

  // Optional external LLM if configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "คุณเป็นผู้ช่วยภายในระบบ TSL Smart Asset ของโรงพยาบาลทุ่งเสลี่ยม ตอบสั้นเป็นภาษาไทย แนะนำเมนูและการใช้งานเท่านั้น ห้ามสร้างตัวเลขปลอม ถ้าต้องอ้างตัวเลขให้บอกว่าให้ถามสรุปตัวเลข",
            },
            { role: "user", content: trimmed },
          ],
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) {
          return { answer: content, source: "llm" as const };
        }
      }
    } catch {
      // fall through
    }
  }

  return {
    answer: [
      "ยังจับประเด็นไม่ชัด — ลองถามแบบนี้ได้:",
      "• สรุปจำนวนครุภัณฑ์ / สต็อก",
      "• วิธีสร้าง QR / ตรวจประจำปี",
      "• วิธีรับเข้า-จ่ายออกวัสดุ",
      "• วิธีนำเข้า Excel",
      `ตัวเลขล่าสุด: ครุภัณฑ์ ${kpis.normalAssets.toLocaleString("th-TH")} · ค้างตรวจ ${kpis.openInspectionPending.toLocaleString("th-TH")}`,
    ].join("\n"),
    source: "fallback" as const,
  };
}
