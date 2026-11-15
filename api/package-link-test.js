import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {runPackageLinkTest} from '../server/template-package-link-test.js';
export default async function handler(req,res){try{await assertInternalAccess(req);if(req.method!=='POST'){res.setHeader('Allow','POST');return sendJson(res,405,{error:'METHOD_NOT_ALLOWED'})}return sendJson(res,200,await runPackageLinkTest(await readJson(req)))}catch(error){return sendError(res,error)}}
