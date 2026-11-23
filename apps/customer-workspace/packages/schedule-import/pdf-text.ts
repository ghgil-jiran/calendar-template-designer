import {existsSync} from 'node:fs';
import type {TextItem} from 'pdfjs-dist/types/src/display/api';
import type {ScheduleEvent} from './contracts.ts';
import {join, sep} from 'node:path';
import {isScheduleDate, parseScheduleText, readMonthlyScheduleEvent} from './schedule-extraction.ts';

export const PDF_WITHOUT_SCHEDULE_TEXT = Symbol('PDF without readable schedule text');

function readMonthlyTable(pages: TextItem[][], year: number, startMonth: number): ScheduleEvent[] | null {
  const events: ScheduleEvent[] = [];
  const months = new Set<number>();
  for (const items of pages) {
    const headerIndex = items.findIndex(item => item.str.trim() === '월');
    const header = items[headerIndex];
    if (!header) continue;
    const headerItems = items.slice(headerIndex).filter(item => Math.abs(item.transform[5] - header.transform[5]) < 2);
    if (!/^(월상세일정)+$/.test(headerItems.map(item => item.str).join('').replace(/\s/g, ''))) continue;
    const monthColumns = headerItems.filter(item => item.str.trim() === '월').map(item => item.transform[4]);
    const columnMonths = new Map<number, number>();
    const rows: {column: number; monthCell: boolean; y: number; text: string}[] = [];
    for (const item of items.slice(headerIndex + 1)) {
      const [,,,,x,y] = item.transform;
      if (y >= header.transform[5] - 2) continue;
      const text = item.str.replace(/\0/g, '');
      if (!text.trim() && !rows.length) continue;
      const column = monthColumns.findLastIndex(left => x >= left - 16);
      if (column < 0) continue;
      const monthCell = x < monthColumns[column] + 16;
      const previous = rows.at(-1);
      if (previous && previous.column === column && previous.monthCell === monthCell && Math.abs(previous.y - y) < 2) {
        previous.text += text;
      } else if (text.trim()) {
        rows.push({column, monthCell, y, text});
      }
    }
    for (const row of rows) {
      const text = row.text.trim();
      if (row.monthCell) {
        if (/^\d{2,4}\s*년$/.test(text)) continue;
        const match = /^(?:\d{2,4}년\s*)?(1[0-2]|0?[1-9])\s*월$/.exec(text);
        if (!match || months.has(Number(match[1]))) return null;
        const month = Number(match[1]);
        months.add(month);
        columnMonths.set(row.column, month);
        continue;
      }
      const month = columnMonths.get(row.column);
      if (!month) return null;
      const event = readMonthlyScheduleEvent(text, month, year, startMonth, 'pdf-' + (events.length + 1));
      if (!event || events.length >= 2000) return null;
      events.push(event);
    }
  }
  return months.size === 12 && events.length ? events : null;
}

/** Accept an unambiguous single-column date list and detect PDFs with no verifiable text. */
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
    const pages = [];
    let hasReadableScheduleText = false;
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const {items} = await page.getTextContent();
      const text = items.map(item => 'str' in item ? item.str : '').join(' ');
      if (/\d/.test(text) && /\p{L}/u.test(text)) hasReadableScheduleText = true;
      pages.push(items);
    }
    if (!hasReadableScheduleText) return PDF_WITHOUT_SCHEDULE_TEXT;

    const monthlyEvents = readMonthlyTable(pages.map(items => items.filter((item): item is TextItem => 'str' in item)), year, startMonth);
    if (monthlyEvents) return {events:monthlyEvents,warnings:[],totalLines:monthlyEvents.length,sourceName:file.name,method:'basic' as const};

    const lines: string[] = [];
    for (const items of pages) {
      const previousLineCount = lines.length;
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
