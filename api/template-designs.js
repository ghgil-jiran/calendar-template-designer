import { assertInternalAccess, readJson, sendError, sendJson, supabaseRequest } from '../server/template-persistence.js';

const table = 'calendar_designer_designs';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && !!value.trim();

function designRow(design) {
  if (!record(design) || !nonempty(design.set_id) || design.set_id.length > 200 ||
      !nonempty(design.title) || !record(design.cover) || !Array.isArray(design.months) ||
      design.months.length > 12 || design.months.some(month =>
        !record(month) || !Number.isInteger(month.month) || month.month < 1 || month.month > 12
      ) || new Set(design.months.map(month => month.month)).size !== design.months.length) {
    throw Object.assign(new Error('Invalid design'), { statusCode: 400, code: 'INVALID_DESIGN' });
  }
  return { set_id: design.set_id, design, updated_at: new Date().toISOString() };
}

async function listDesigns() {
  const designs = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const rows = await supabaseRequest(`${table}?select=design&order=set_id.asc&limit=${pageSize}&offset=${offset}`);
    designs.push(...rows.map(row => row.design));
    if (rows.length < pageSize) return designs;
  }
}

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request);
    if (request.method === 'GET') {
      return sendJson(response, 200, { designs: await listDesigns() });
    }
    if (request.method === 'POST') {
      const body = await readJson(request);
      const row = designRow(body?.design);
      const resolution = body.importExisting === true ? 'ignore-duplicates' : 'merge-duplicates';
      await supabaseRequest(`${table}?on_conflict=set_id`, {
        method: 'POST',
        headers: { Prefer: `resolution=${resolution},return=minimal` },
        body: JSON.stringify(row)
      });
      return sendJson(response, 200, { ok: true });
    }
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    return sendError(response, error);
  }
}
