import {assertInternalAccess,readJson,sendJson,sendError} from '../server/template-persistence.js';
import {installWallSampleA} from '../server/wall-sample-a-installation.js';
import {installPosterDuplex} from '../server/poster-duplex-installation.js';
import {installPosterSample} from '../server/poster-sample-installation.js';
export default async function handler(req,res){try{await assertInternalAccess(req);if(req.method!=='POST'){res.setHeader('Allow','POST');return sendJson(res,405,{error:'METHOD_NOT_ALLOWED'})}const body=await readJson(req);if(body.variant==='floral-a')return sendJson(res,200,await installWallSampleA(body));if(body.variant==='duplex')return sendJson(res,200,await installPosterDuplex({sourceTemplateId:body.sourceTemplateId}));if(body.pageCount!==undefined&&![1,2].includes(body.pageCount))return sendJson(res,400,{error:'INVALID_PAGE_COUNT'});return sendJson(res,200,await installPosterSample(undefined,body.pageCount||1))}catch(error){return sendError(res,error)}}
