import { assertInternalAccess, sendError, sendJson } from '../server/template-persistence.js';
import { forwardReviewPackage } from '../server/user-service-review-publisher.js';

export const config={api:{bodyParser:{sizeLimit:'2mb'}}};

export default async function handler(request,response){
  try{
    await assertInternalAccess(request);
    if(request.method!=='POST'){
      response.setHeader('Allow','POST');
      return sendJson(response,405,{error:'METHOD_NOT_ALLOWED'});
    }
    const authorization=String(request.headers?.authorization||request.headers?.Authorization||'');
    const result=await forwardReviewPackage({authorization,body:request.body});
    return sendJson(response,200,result);
  }catch(error){return sendError(response,error)}
}
