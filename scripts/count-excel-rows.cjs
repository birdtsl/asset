const XLSX = require("xlsx");

const files = [
  {
    type: "NORMAL",
    file: String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่.xlsm`,
  },
  {
    type: "LOW_VALUE",
    file: String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่า\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่าเกณฑ์.xlsm`,
  },
];

for (const f of files) {
  const wb = XLSX.readFile(f.file, { sheetRows: 0 });
  const ws = wb.Sheets["Data"];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  let dataRows = 0;
  for (let i = 3; i < rows.length; i++) {
    const code = String(rows[i][6] || "").trim();
    const name = String(rows[i][5] || "").trim();
    if (code || name) dataRows++;
  }
  console.log(f.type, "totalRows=", rows.length, "dataRows=", dataRows);
}
