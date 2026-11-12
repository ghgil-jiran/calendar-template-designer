import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {repairSampleDPrint} from '../server/sample-d-print-repair.js';
import {installSampleD} from '../server/sample-d-installation.js';
export default async function handler(request,response){try{response.setHeader('Cache-Control','no-store');await assertInternalAccess(request);if(request.method!=='POST')return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});return sendJson(response,200,await (async()=>{const body=await readJson(request);return body.mode==='print-repair'?repairSampleDPrint(body):installSampleD(body);})());}catch(error){return sendError(response,error);}}
