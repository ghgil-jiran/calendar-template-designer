import {mkdir,readFile} from 'node:fs/promises';import path from 'node:path';
import {collectProductionWorkerInput} from './lib/production-worker-input.mjs';
import {inspectProductionIcc,prepareProductionCmykImages} from './lib/production-cmyk-images.mjs';
const args=process.argv.slice(2),options={},allowed=new Set(['inspection','work-dir','icc','icc-sha256','srgb-icc','magick']);
try{
 for(let i=0;i<args.length;i+=2){const name=args[i]?.slice(2);if(!args[i]?.startsWith('--')||!allowed.has(name)||!args[i+1]||args[i+1].startsWith('--')||Object.hasOwn(options,name))throw Error('Worker 옵션·중복·경로를 확인해 주세요.');options[name]=args[i+1];}
 for(const name of ['inspection','work-dir','icc','icc-sha256','srgb-icc'])if(!options[name])throw Error(`필수 옵션: --${name}`);
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('신뢰된 Worker 환경의 Supabase 연결 설정이 필요합니다.');
 inspectProductionIcc(await readFile(options.icc),options['icc-sha256']);
 const inspection=JSON.parse(await readFile(options.inspection,'utf8')),root=path.resolve(options['work-dir']);await mkdir(root);
 const input=await collectProductionWorkerInput({requestId:inspection.requestId,revisionId:inspection.revisionId,documentHash:inspection.documentHash,contentHash:inspection.plan?.contentHash,inspection,outputDir:path.join(root,'input'),onProgress:p=>console.log(`[원본 ${p.completed+1}/${p.total}] ${p.source}`)});
 const manifest=await prepareProductionCmykImages({...input,outputDir:path.join(root,'cmyk'),iccPath:options.icc,expectedIccSha256:options['icc-sha256'],srgbProfilePath:options['srgb-icc'],magickCommand:options.magick,onProgress:p=>console.log(`[CMYK ${p.completed}/${p.total}] ${p.status}`)});
 console.log(`교정 ${manifest.revisionId}: 원본 ${manifest.derived.length}개 CMYK 준비 완료. 최종 PDF 생성과 인쇄 승인은 별도입니다.`);
}catch(error){console.error(`Worker 중단: ${error.message}`);process.exitCode=1;}
