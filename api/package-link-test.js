import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {runPackageLinkTest} from '../server/template-package-link-test.js';
import {runPackageLinkBatch} from '../server/template-package-link-batch.js';
export default async function handler(req,res){try{await assertInternalAccess(req);if(req.method!=='POST'){res.setHeader('Allow','POST');return sendJson(res,405,{error:'METHOD_NOT_ALLOWED'})}const body=await readJson(req);return sendJson(res,200,await (String(body.step).startsWith('batch-')?runPackageLinkBatch(body):runPackageLinkTest(body)))}catch(error){return sendError(res,error)}}
