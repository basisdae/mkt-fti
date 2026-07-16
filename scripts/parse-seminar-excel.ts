import ExcelJS from "exceljs";
import { writeFileSync } from "fs";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("Seminar Planner-1.xlsx");

  const out: Record<string, unknown> = { sheets: {} as Record<string, unknown> };

  for (const ws of wb.worksheets) {
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > 30) return;
        const v = cell.value;
        if (v == null) cells.push("");
        else if (typeof v === "object" && "text" in (v as object))
          cells.push(String((v as { text: string }).text));
        else if (typeof v === "object" && "result" in (v as object))
          cells.push(String((v as { result: unknown }).result ?? ""));
        else cells.push(String(v));
      });
      rows.push(cells);
    });
    (out.sheets as Record<string, unknown>)[ws.name] = {
      rowCount: rows.length,
      rows,
    };
    console.log(`Sheet "${ws.name}": ${rows.length} rows`);
    for (let i = 0; i < Math.min(6, rows.length); i++) {
      console.log(`  R${i + 1}: ${rows[i].slice(0, 12).join(" | ")}`);
    }
  }

  writeFileSync(
    "scripts/seminar-planner-excel-dump.json",
    JSON.stringify(out, null, 2),
    "utf8",
  );
  console.log("\nWrote scripts/seminar-planner-excel-dump.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
