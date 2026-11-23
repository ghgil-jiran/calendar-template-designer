import {existsSync} from 'node:fs';
import {join, sep} from 'node:path';
import {isScheduleDate, parseScheduleText} from './schedule-extraction.ts';

/** Accept an unambiguous single-column date list. Tables and scans go to document analysis. */
export async function readPdfDateList(file: File, year: number, startMonth: number) {
  const {getDocument} = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const cMapDirectory = [process.cwd(), join(process.cwd(), 'apps/customer-workspace')]
    .map(root => join(root, 'node_modules/pdfjs-dist/cmaps'))
    .find(directory => existsSync(directory));
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: cMapDirectory ? cMapDirectory + sep : undefined,
    cMapPacked: true,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
  });
  try {
    const document = await task.promise;
    if (document.numPages > 30) return null;
    const lines: string[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const previousLineCount = lines.length;
      const page = await document.getPage(index);
      const {items} = await page.getTextContent();
      let line = '';
      let lineX: number | undefined;
      let firstX: number | undefined;
      let lineY: number | undefined;
      for (const item of items) {
        if (!('str' in item)) continue;
        const [,,,,x,y] = item.transform;
        if (item.str.trim()) {
          if (lineY !== undefined && Math.abs(y - lineY) > 2) return null;
          lineX ??= x;
          lineY ??= y;
          line += item.str;
        } else if (item.str) {
          line += item.str;
        }
        if (!item.hasEOL) continue;
        if (line.trim()) {
          firstX ??= lineX;
          if (firstX !== undefined && lineX !== undefined && Math.abs(firstX - lineX) > 3) return null;
          lines.push(line.trim());
        }
        line = '';
        lineX = lineY = undefined;
      }
      if (line.trim()) {
        if (firstX !== undefined && lineX !== undefined && Math.abs(firstX - lineX) > 3) return null;
        lines.push(line.trim());
      }
      if (lines.length === previousLineCount) return null;
    }
    if (!lines.length || lines.some(line => !/^\d{4}[-./]\d{1,2}[-./]\d{1,2}(?!\d)/.test(line))) return null;
    const result = parseScheduleText(lines.join('\n'), year, startMonth);
    if (result.warnings.length || !result.events.length) return null;
    const rebase = (date: string) => String(year + (Number(date.slice(5, 7)) < startMonth ? 1 : 0)) + date.slice(4);
    const events = result.events.map(event => ({...event,startDate:rebase(event.startDate),endDate:rebase(event.endDate)}));
    if (events.some(event => !isScheduleDate(event.startDate) || !isScheduleDate(event.endDate) || event.endDate < event.startDate)) return null;
    return {...result,events,sourceName:file.name,method:'basic' as const};
  } finally {
    await task.destroy();
  }
}
