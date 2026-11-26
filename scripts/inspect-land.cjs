const XLSX = require("xlsx");
const path = require("path");

const file = path.join(
  "E:",
  "ทะเบียนครุภัณฑ์",
  "ทะเบียนคุมที่ดิน.xlsx",
);

const wb = XLSX.readFile(file, {
  sheetRows: 20,
  cellDates: true,
  raw: false,
});

console.log("sheets:", wb.SheetNames);
for (const name of wb.SheetNames.slice(0, 5)) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {
    header: 1,
    defval: "",
    raw: false,
  });
  console.log(`\n-- ${name} previewRows=${rows.length}`);
  rows.slice(0, 15).forEach((r, i) => {
    const cleaned = [...r];
    while (cleaned.length && String(cleaned[cleaned.length - 1]).trim() === "") {
      cleaned.pop();
    }
    console.log(`R${i + 1}:`, JSON.stringify(cleaned));
  });
}
