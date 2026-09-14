import { assertInternalAccess, deleteTemplate, getTemplate, listDeletedCatalogKeys, listTemplates, readJson, saveVersion, sendError, sendJson } from '../server/template-persistence.js';
import { forwardReviewPackage } from '../server/user-service-review-publisher.js';

export default async function handler(request, response) {
  try {
    if (request.method === 'POST') {
      const body=await readJson(request);
      if(body?.operation==='publish-review'){
        const authorization=String(request.headers?.authorization||request.headers?.Authorization||'');
        return sendJson(response,200,await forwardReviewPackage({authorization,body:body.reviewBody}));
      }
      await assertInternalAccess(request);
      return sendJson(response, 201, await saveVersion(body));
    }
    await assertInternalAccess(request);
    if (request.method === 'GET') {
      const templateId = new URL(request.url, 'http://localhost').searchParams.get('id');
      if(templateId)return sendJson(response,200,await getTemplate(templateId));
      const startedAt=Date.now(),[templates,deletedCatalogKeys]=await Promise.all([listTemplates(),listDeletedCatalogKeys()]);
      console.log('[template-library] remote list loaded',{templateCount:templates.length,deletedCatalogKeyCount:deletedCatalogKeys.length,durationMs:Date.now()-startedAt});
      return sendJson(response,200,{templates,deletedCatalogKeys});
    }
    if (request.method === 'DELETE') return sendJson(response, 200, await deleteTemplate(await readJson(request)));
    response.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  } catch (error) { return sendError(response, error); }
}
