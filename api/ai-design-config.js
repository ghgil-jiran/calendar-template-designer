import { hasOpenAIKey, storeOpenAIKey } from '../server/ai-secret-store.js';
import { assertInternalAccess, readJson, sendError, sendJson } from '../server/template-persistence.js';

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request);
    if (request.method === 'GET') {
      return sendJson(response, 200, { configured: await hasOpenAIKey(), storage: 'supabase-vault' });
    }
    if (request.method === 'PUT') {
      const body = await readJson(request);
      await storeOpenAIKey(body?.apiKey);
      return sendJson(response, 200, { configured: true, storage: 'supabase-vault' });
    }
    response.setHeader('Allow', 'GET, PUT');
    return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'GET 또는 PUT 요청만 지원합니다.' } });
  } catch (error) {
    return sendError(response, error);
  }
}
