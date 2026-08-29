import { assertInternalAccess, listVersions, sendError, sendJson } from '../server/template-persistence.js';

export default async function handler(request, response) {
  try {
    assertInternalAccess(request);
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
    }
    const templateId = new URL(request.url, 'http://localhost').searchParams.get('templateId');
    return sendJson(response, 200, { versions: await listVersions(templateId) });
  } catch (error) { return sendError(response, error); }
}
