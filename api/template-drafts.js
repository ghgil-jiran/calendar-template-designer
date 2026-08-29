import { assertInternalAccess, readJson, saveDraft, sendError, sendJson } from '../server/template-persistence.js';

export default async function handler(request, response) {
  try {
    assertInternalAccess(request);
    if (request.method === 'PUT' || request.method === 'POST') return sendJson(response, 200, { draft: await saveDraft(await readJson(request)) });
    response.setHeader('Allow', 'PUT, POST');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) { return sendError(response, error); }
}
