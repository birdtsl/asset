const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const files = [
  String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่.xlsm`,
  String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่า\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่าเกณฑ์.xlsm`,
];

for (const file of files) {
  console.log(
    "\n====",
    path.basename(file),
    "sizeMB=",
    (fs.statSync(file).size / 1024 / 1024).toFixed(2),
  );
  const wb = XLSX.readFile(file, {
    sheetRows: 12,
    cellDates: true,
    raw: false,
  });
  console.log("sheets:", wb.SheetNames);
  for (const name of wb.SheetNames.slice(0, 4)) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
      raw: false,
    });
    console.log(`\n-- sheet: ${name} previewRows=${rows.length}`);
    rows.forEach((r, i) => {
      const cleaned = [...r];
      while (cleaned.length && String(cleaned[cleaned.length - 1]).trim() === "") {
        cleaned.pop();
      }
      console.log(`R${i + 1}:`, JSON.stringify(cleaned));
    });
  }
}
