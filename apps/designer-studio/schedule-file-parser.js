(function (root) {
  const decoder = new TextDecoder('utf-8');

  function u16(view, offset) {
    return view.getUint16(offset, true);
  }

  function u32(view, offset) {
    return view.getUint32(offset, true);
  }

  function xmlText(value) {
    return String(value || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== 'function') {
      throw new Error('이 브라우저는 XLSX 압축 해제를 지원하지 않습니다.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let eocd = -1;
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset -= 1) {
      if (u32(view, offset) === 0x06054b50) {
        eocd = offset;
        break;
      }
    }
    if (eocd < 0) throw new Error('올바른 XLSX 파일이 아닙니다.');
    const count = u16(view, eocd + 10);
    let cursor = u32(view, eocd + 16);
    const entries = new Map();
    for (let index = 0; index < count; index += 1) {
      if (u32(view, cursor) !== 0x02014b50) throw new Error('XLSX 파일 목록을 읽지 못했습니다.');
      const method = u16(view, cursor + 10);
      const compressedSize = u32(view, cursor + 20);
      const nameLength = u16(view, cursor + 28);
      const extraLength = u16(view, cursor + 30);
      const commentLength = u16(view, cursor + 32);
      const localOffset = u32(view, cursor + 42);
      const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
      if (u32(view, localOffset) !== 0x04034b50) throw new Error('XLSX 셀 데이터 위치를 읽지 못했습니다.');
      const localNameLength = u16(view, localOffset + 26);
      const localExtraLength = u16(view, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const data = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
      if (data) entries.set(name, decoder.decode(data));
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  function columnIndex(reference) {
    const letters = String(reference || '').match(/^[A-Z]+/)?.[0] || 'A';
    return [...letters].reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0) - 1;
  }

  function sharedStrings(xml) {
    return [...String(xml || '').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)]
      .map(match => [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(item => xmlText(item[1])).join(''));
  }

  function worksheetRows(xml, shared) {
    const rows = [];
    for (const rowMatch of String(xml || '').matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row = [];
      for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1];
        const body = cellMatch[2];
        const ref = attrs.match(/\br="([^"]+)"/)?.[1];
        const type = attrs.match(/\bt="([^"]+)"/)?.[1] || '';
        const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
        const inline = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(item => xmlText(item[1])).join('');
        let value = type === 'inlineStr' ? inline : xmlText(raw);
        if (type === 's') value = shared[Number(value)] ?? '';
        row[columnIndex(ref)] = value;
      }
      rows.push(row.map(value => String(value ?? '').trim()));
    }
    return rows;
  }

  function excelDate(serial) {
    const value = Number(serial);
    if (!Number.isFinite(value) || value < 20000 || value > 80000) return null;
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }

  function usefulTitle(values) {
    const ignored = /^(일자|날짜|기간|요일|구분|월|일|학사일정|주요행사|행사명|내용)$/;
    return values.map(value => String(value || '').trim()).filter(value => value && !ignored.test(value)).join(', ');
  }

  function rowsToScheduleText(rows, baseYear) {
    let year = Number(baseYear) || new Date().getFullYear();
    let month = null;
    const output = [];
    const setMonth = (nextYear, nextMonth) => {
      year = Number(nextYear || year);
      month = Number(nextMonth);
      output.push(`${year}년 ${month}월`);
    };
    for (const source of rows) {
      const cells = source.map(value => String(value || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (!cells.length) continue;
      const joined = cells.join(' ');
      let header = joined.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/);
      if (header) {
        setMonth(header[1], header[2]);
        const rest = usefulTitle(cells.filter(value => !value.includes(header[0])));
        if (!rest) continue;
      } else {
        header = cells.find(value => /^(\d{1,2})\s*월$/.test(value))?.match(/^(\d{1,2})\s*월$/);
        if (header) {
          setMonth(year, header[1]);
          if (cells.length === 1) continue;
          cells.splice(cells.findIndex(value => /^(\d{1,2})\s*월$/.test(value)), 1);
        }
      }

      let dateIndex = -1;
      let startMonth = month;
      let startDay = null;
      let endMonth = null;
      let endDay = null;
      for (let index = 0; index < cells.length; index += 1) {
        const value = cells[index];
        const serial = excelDate(value);
        if (serial) {
          year = serial.year; startMonth = serial.month; startDay = serial.day; dateIndex = index; break;
        }
        let match = value.match(/^(?:(\d{4})[-./])?(\d{1,2})[-./](\d{1,2})(?:\s*[-~～]\s*(?:(\d{1,2})[-./])?(\d{1,2}))?$/);
        if (match) {
          if (match[1]) year = Number(match[1]);
          startMonth = Number(match[2]); startDay = Number(match[3]);
          endMonth = Number(match[4] || startMonth); endDay = Number(match[5] || startDay); dateIndex = index; break;
        }
        match = value.match(/^(?:(\d{1,2})\s*월\s*)?(\d{1,2})(?:\s*일)?(?:\s*[-~～]\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})(?:\s*일)?)?$/);
        if (match && (month || match[1])) {
          startMonth = Number(match[1] || month); startDay = Number(match[2]);
          endMonth = Number(match[3] || startMonth); endDay = Number(match[4] || startDay); dateIndex = index; break;
        }
      }
      if (dateIndex < 0 || !startMonth || !startDay) continue;
      if (month !== startMonth) setMonth(year, startMonth);
      const title = usefulTitle(cells.filter((_, index) => index !== dateIndex));
      if (!title) continue;
      const datePart = endDay && (endDay !== startDay || endMonth !== startMonth)
        ? `${startMonth}월 ${startDay}일-${endMonth || startMonth}월 ${endDay}일`
        : `${startDay}일`;
      output.push(`${datePart} : ${title}`);
    }
    return output.join('\n');
  }

  async function extractText(file, baseYear) {
    const extension = String(file?.name || '').split('.').pop().toLowerCase();
    if (extension === 'txt' || extension === 'csv') return { text: await file.text(), sheetCount: 0, rowCount: 0 };
    if (extension !== 'xlsx') throw new Error('템플릿 샘플 일정은 XLSX·CSV·TXT 파일을 지원합니다.');
    const entries = await unzip(await file.arrayBuffer());
    const shared = sharedStrings(entries.get('xl/sharedStrings.xml'));
    const sheets = [...entries.entries()]
      .filter(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
      .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }));
    const rows = sheets.flatMap(([, xml]) => worksheetRows(xml, shared));
    if (!rows.length) throw new Error('XLSX 파일에서 일정 셀을 찾지 못했습니다.');
    return { text: rowsToScheduleText(rows, baseYear), sheetCount: sheets.length, rowCount: rows.length };
  }

  root.ACDLScheduleFileParser = Object.freeze({ extractText, rowsToScheduleText, worksheetRows });
})(typeof window !== 'undefined' ? window : globalThis);
