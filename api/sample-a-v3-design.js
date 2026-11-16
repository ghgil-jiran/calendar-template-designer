import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {runSampleADesign} from '../server/sample-a-v3-design.js';
export default async function handler(req,res){try{await assertInternalAccess(req);if(req.method!=='POST'){res.setHeader('Allow','POST');return sendJson(res,405,{error:'METHOD_NOT_ALLOWED'});}return sendJson(res,200,await runSampleADesign(await readJson(req)));}catch(e){return sendError(res,e);}}
