import { readJson, sendError, sendJson } from '../server/template-persistence.js';
import { refreshMasterAdmin, requireMasterAdmin, signInMasterAdmin } from '../server/admin-auth.js';

export default async function handler(request, response) {
  try {
    if (request.method === 'GET') return sendJson(response, 200, { user: await requireMasterAdmin(request) });
    if (request.method === 'POST') {
      const body = await readJson(request);
      if (body.action === 'refresh' && typeof body.refreshToken === 'string') return sendJson(response, 200, await refreshMasterAdmin(body.refreshToken));
      if (body.action === 'sign-in' && typeof body.email === 'string' && typeof body.password === 'string') return sendJson(response, 200, await signInMasterAdmin(body.email.trim(), body.password));
      return sendJson(response, 400, { error: 'INVALID_REQUEST' });
    }
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) { return sendError(response, error); }
}
