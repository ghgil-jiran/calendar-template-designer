import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {installSampleC} from '../server/sample-c-installation.js';
export default async function handler(request,response){
 try{
  response.setHeader('Cache-Control','no-store');
  await assertInternalAccess(request);
  if(request.method!=='POST'){response.setHeader('Allow','POST');return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});}
  return sendJson(response,200,await installSampleC(await readJson(request)));
 }catch(error){return sendError(response,error);}
}
