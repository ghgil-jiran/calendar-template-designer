import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {updateSampleALogo} from '../server/sample-a-logo.js';
export default async function handler(request,response){try{response.setHeader('Cache-Control','no-store');await assertInternalAccess(request);if(request.method!=='POST')return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});return sendJson(response,200,await updateSampleALogo(await readJson(request)));}catch(error){return sendError(response,error);}}
