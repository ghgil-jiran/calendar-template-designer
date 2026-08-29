import { assertInternalAccess, readJson, restoreVersion, sendError, sendJson } from '../server/template-persistence.js';

export default async function handler(request, response) {
  try {
    assertInternalAccess(request);
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
    }
    return sendJson(response, 201, await restoreVersion(await readJson(request)));
  } catch (error) { return sendError(response, error); }
}
