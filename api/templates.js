import { assertInternalAccess, getTemplate, listTemplates, readJson, saveVersion, sendError, sendJson } from '../server/template-persistence.js';

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request);
    if (request.method === 'GET') {
      const templateId = new URL(request.url, 'http://localhost').searchParams.get('id');
      return sendJson(response, 200, templateId ? await getTemplate(templateId) : { templates: await listTemplates() });
    }
    if (request.method === 'POST') return sendJson(response, 201, await saveVersion(await readJson(request)));
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) { return sendError(response, error); }
}
