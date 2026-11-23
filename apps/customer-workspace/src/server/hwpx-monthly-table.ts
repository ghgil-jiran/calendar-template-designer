function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

/**
 * section XML 에서 표를 (row, col) 격자로 복원한다.
 * hwpx 는 셀마다 <hp:cellAddr colAddr rowAddr/> 를 갖고 있어 병합 셀이 있어도 좌표가 어긋나지 않는다.
 */
export function extractTables(sectionXml: string): string[][][] {
  const tables: string[][][] = [];
  // <hp:tbl ...> ... </hp:tbl> 단위로 자른다 (표 중첩은 이 양식에 없으며, 있으면 뒤 검증에서 걸러진다)
  const chunks = sectionXml.split("<hp:tbl ").slice(1);
  for (const chunk of chunks) {
    const end = chunk.indexOf("</hp:tbl>");
    const body = end >= 0 ? chunk.slice(0, end) : chunk;
    const grid: string[][] = [];
    // 셀 = <hp:tc ...> ... </hp:tc>
    for (const cellChunk of body.split("<hp:tc ").slice(1)) {
      const cellEnd = cellChunk.indexOf("</hp:tc>");
      const cell = cellEnd >= 0 ? cellChunk.slice(0, cellEnd) : cellChunk;
      const addr = /<hp:cellAddr colAddr="(\d+)" rowAddr="(\d+)"\/>/.exec(cell);
      if (!addr) continue;
      const col = Number(addr[1]);
      const row = Number(addr[2]);
      // 셀 안의 문단(<hp:p>)마다 줄바꿈으로 잇는다 — 한 칸에 여러 일정이 들어가는 양식 대응
      const paras = cell.split("<hp:p ").slice(1);
      const lines = (paras.length > 0 ? paras : [cell]).map((p) =>
        [...p.matchAll(/<hp:t>([\s\S]*?)<\/hp:t>/g)]
          .map((m) => decodeEntities(m[1]!))
          .join("")
          .trim(),
      );
      const text = lines.filter(Boolean).join("\n");
      (grid[row] ??= [])[col] = text;
    }
    if (grid.length > 0) tables.push(grid.map((r) => Array.from(r, (c) => c ?? "")));
  }
  return tables;
}


export function readMonthlyHwpx(sectionXml: string) {
  const entries: {month: number; lines: string[]}[] = [];
  for (const rows of extractTables(sectionXml)) {
    let columns: number[] = [];
    for (const row of rows) {
      const labels = row.map(cell => cell.replace(/\s/g, ""));
      const header = labels.flatMap((label, col) =>
        label === "월" && /^(상세)?일정$/.test(labels[col + 1] ?? "") ? [col] : []);
      if (header.length) {
        columns = header;
        continue;
      }
      for (const col of columns) {
        const lines = row[col + 1]?.split("\n").filter(Boolean);
        if (!lines?.length) continue;
        const month = /^(?:\d{2,4}년\s*)?(1[0-2]|0?[1-9])\s*월$/.exec(row[col] ?? "");
        if (!month) return null;
        entries.push({month: Number(month[1]), lines});
      }
    }
  }
  return entries;
}

