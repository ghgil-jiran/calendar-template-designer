import { assertInternalAccess, deleteTemplate, getTemplate, listDeletedCatalogKeys, listTemplates, readJson, saveVersion, sendError, sendJson } from '../server/template-persistence.js';
import { forwardReviewPackage } from '../server/user-service-review-publisher.js';

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request);
    if (request.method === 'GET') {
      const templateId = new URL(request.url, 'http://localhost').searchParams.get('id');
      return sendJson(response, 200, templateId ? await getTemplate(templateId) : { templates: await listTemplates(), deletedCatalogKeys: await listDeletedCatalogKeys() });
    }
    if (request.method === 'POST') {
      const body=await readJson(request);
      if(body?.operation==='publish-review'){
        const authorization=String(request.headers?.authorization||request.headers?.Authorization||'');
        return sendJson(response,200,await forwardReviewPackage({authorization,body:body.reviewBody}));
      }
      return sendJson(response, 201, await saveVersion(body));
    }
    if (request.method === 'DELETE') return sendJson(response, 200, await deleteTemplate(await readJson(request)));
    response.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) { return sendError(response, error); }
}
