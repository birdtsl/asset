import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TSL Smart Asset · แดชบอร์ดสาธารณะ",
  description: "สรุปทะเบียนครุภัณฑ์สำหรับฝังในระบบ MIS",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
