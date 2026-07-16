import ExcelJS from "exceljs";
import { writeFileSync } from "fs";

type Section =
  | "target_groups"
  | "purposes"
  | "speakers"
  | "session_formats"
  | "session_statuses"
  | "session_categories"
  | "session_library";

const SECTION_MARKERS: Record<string, Section> = {
  TargetGroups: "target_groups",
  MainObjectives: "purposes",
  Speakers: "speakers",
  Formats: "session_formats",
  Statuses: "session_statuses",
  SessionLibrary: "session_library",
};

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "text" in (v as object))
    return String((v as { text: string }).text).trim();
  if (typeof v === "object" && "result" in (v as object))
    return String((v as { result: unknown }).result ?? "").trim();
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function parseTimeFraction(v: ExcelJS.CellValue): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    const h = v.getHours();
    const m = v.getMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const s = cellText(v);
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return s || null;
}

function parseDateOnly(v: ExcelJS.CellValue): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = cellText(v);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s || null;
}

function splitBullets(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts = t
    .split(/\n|•|·|▪|◦|●|○|–\s|—\s|\d+\)\s+|\d+\.\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [t];
  return parts;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("Seminar Planner-1.xlsx");
  const dataWs = wb.getWorksheet("Data")!;
  const agendaWs = wb.getWorksheet("Agenda Planner")!;

  const sections: Record<Section, unknown[]> = {
    target_groups: [],
    purposes: [],
    speakers: [],
    session_formats: [],
    session_statuses: [],
    session_categories: [],
    session_library: [],
  };

  let current: Section | null = null;
  let headers: string[] = [];

  dataWs.eachRow({ includeEmpty: false }, (row) => {
    const a = cellText(row.getCell(1).value);
    const marker = SECTION_MARKERS[a];
    if (marker) {
      current = marker;
      headers = [];
      return;
    }
    if (!current) return;

    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      if (col > 20) return;
      cells.push(cellText(cell.value));
    });
    while (cells.length && !cells[cells.length - 1]) cells.pop();
    if (!cells.some(Boolean)) return;

    if (!headers.length) {
      headers = cells;
      return;
    }

    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = cells[i] ?? "";
    });

    if (current === "session_library") {
      sections.session_library.push({
        category: obj["หมวด"] ?? "",
        title: obj["หัวข้อ"] ?? "",
        recommended_format: obj["รูปแบบแนะนำ"] ?? "",
        recommended_minutes: Number(obj["เวลาแนะนำ(นาที)"] || 0) || null,
        recommended_speaker: obj["วิทยากรแนะนำ"] ?? "",
        detail_bullets: splitBullets(obj["Detail"] ?? ""),
        objectives_bullets: splitBullets(
          obj["จุดประสงค์ย่อย / สิ่งที่ต้องสื่อ"] ?? "",
        ),
        outcomes_bullets: splitBullets(
          obj["ผลลัพธ์ที่อยากได้กลับมา"] ?? "",
        ),
        target_groups: (obj["เหมาะกับกลุ่ม"] ?? "")
          .split(/[,，、]/)
          .map((s) => s.trim())
          .filter(Boolean),
        active: true,
        sort_order: sections.session_library.length + 1,
      });
    } else if (current === "session_formats") {
      const name = obj["รูปแบบ Session"] ?? cells[0] ?? "";
      if (!name || name === "รูปแบบ Session") return;
      sections.session_formats.push({ name, description: cells[1] ?? "" });
    } else if (current === "session_statuses") {
      const name = obj["สถานะ"] ?? cells[0] ?? "";
      if (!name || name === "สถานะ") return;
      sections.session_statuses.push({ name, description: cells[1] ?? "" });
    } else if (current === "target_groups") {
      sections.target_groups.push({
        name: obj["กลุ่มเป้าหมาย"] ?? cells[0] ?? "",
        description: obj["รายละเอียด"] ?? cells[1] ?? "",
      });
    } else if (current === "purposes") {
      sections.purposes.push({
        name: obj["จุดประสงค์หลัก"] ?? cells[0] ?? "",
        description: obj["รายละเอียด"] ?? cells[1] ?? "",
      });
    } else if (current === "speakers") {
      sections.speakers.push({
        name: obj["วิทยากร/เจ้าของช่วง"] ?? cells[0] ?? "",
        role: obj["บทบาทที่เหมาะสม"] ?? cells[1] ?? "",
      });
    }
  });

  // Agenda event metadata
  const getMeta = (label: string) => {
    for (let r = 3; r <= 7; r++) {
      const row = agendaWs.getRow(r);
      if (cellText(row.getCell(1).value) === label) {
        return cellText(row.getCell(2).value);
      }
    }
    return "";
  };

  const agendaRows: Record<string, unknown>[] = [];
  let headerRow = 0;
  agendaWs.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (cellText(row.getCell(1).value) === "ลำดับ" && !headerRow) {
      headerRow = rowNum;
      return;
    }
    if (!headerRow || rowNum <= headerRow) return;
    const seq = cellText(row.getCell(1).value);
    if (!seq || !/^\d+$/.test(seq)) return;
    agendaRows.push({
      sort_order: Number(seq),
      session_date: parseDateOnly(row.getCell(2).value),
      title: cellText(row.getCell(3).value),
      category: cellText(row.getCell(4).value),
      format: cellText(row.getCell(5).value),
      start_time: parseTimeFraction(row.getCell(6).value),
      end_time: parseTimeFraction(row.getCell(7).value),
      minutes: Number(cellText(row.getCell(8).value) || 0) || null,
      speaker: cellText(row.getCell(9).value),
      status: cellText(row.getCell(10).value),
      detail_bullets: splitBullets(cellText(row.getCell(11).value)),
      objectives_bullets: splitBullets(cellText(row.getCell(12).value)),
      outcomes_bullets: splitBullets(cellText(row.getCell(13).value)),
      target_groups: cellText(row.getCell(14).value)
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean),
      team_notes: cellText(row.getCell(15).value),
      owner: cellText(row.getCell(16).value),
    });
  });

  const categorySet = new Set<string>();
  for (const s of sections.session_library as Array<{ category: string }>) {
    if (s.category) categorySet.add(s.category);
  }
  sections.session_categories = [...categorySet].map((name, i) => ({
    name,
    description: "",
    color_hint: "",
    sort_order: i + 1,
  }));

  const seed = {
    source: "Seminar Planner-1.xlsx",
    event: {
      title: getMeta("ชื่องาน") || "FTI CONNECT 2026",
      event_date: parseDateOnly(getMeta("วันที่จัดงาน")),
      primary_target_group: getMeta("กลุ่มเป้าหมายหลัก"),
      primary_purpose: getMeta("จุดประสงค์หลัก"),
      notes: getMeta("หมายเหตุภาพรวม"),
    },
    master: sections,
    agenda: agendaRows,
    counts: Object.fromEntries(
      Object.entries(sections).map(([k, v]) => [k, (v as unknown[]).length]),
    ),
  };

  writeFileSync(
    "scripts/seminar-planner-seed-data.json",
    JSON.stringify(seed, null, 2),
    "utf8",
  );
  console.log(JSON.stringify(seed.counts, null, 2));
  console.log("event:", seed.event);
  console.log("agenda sessions:", agendaRows.length);
  console.log("sample library:", sections.session_library.slice(0, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
