import ExcelJS from "exceljs";
import path from "path";

const files = [
  {
    key: "normal",
    file: String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่.xlsm`,
  },
  {
    key: "low",
    file: String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่า\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่าเกณฑ์.xlsm`,
  },
];

function cellText(cell) {
  if (cell == null) return "";
  if (typeof cell === "object" && cell.text != null) return String(cell.text).trim();
  if (typeof cell === "object" && cell.result != null) return String(cell.result).trim();
  if (typeof cell === "object" && cell.richText) {
    return cell.richText.map((r) => r.text).join("").trim();
  }
  return String(cell).trim();
}

async function inspect(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  console.log("\n==== FILE:", path.basename(filePath));
  console.log("sheets:", wb.worksheets.map((ws) => ws.name));

  for (const ws of wb.worksheets.slice(0, 3)) {
    console.log(`\n-- sheet: ${ws.name} rows=${ws.rowCount} cols=${ws.columnCount}`);
    const maxRow = Math.min(ws.rowCount || 0, 8);
    for (let r = 1; r <= maxRow; r++) {
      const row = ws.getRow(r);
      const values = [];
      const colCount = Math.min(row.cellCount || ws.columnCount || 20, 25);
      for (let c = 1; c <= colCount; c++) {
        values.push(cellText(row.getCell(c).value));
      }
      while (values.length && values[values.length - 1] === "") values.pop();
      console.log(`R${r}:`, JSON.stringify(values));
    }
  }
}

for (const f of files) {
  await inspect(f.file);
}
