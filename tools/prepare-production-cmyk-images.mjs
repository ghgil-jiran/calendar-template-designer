import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {prepareProductionCmykImages} from './lib/production-cmyk-images.mjs';

const usage=`CMYK 원본 묶음 실행 (ZIP을 먼저 풀어 주세요):
node tools/prepare-production-cmyk-images.mjs --bundle-dir "묶음 폴더" --output-dir "새 출력 폴더" --icc "JapanColor2011Coated.icc" --icc-sha256 "확인한 SHA256" --srgb-icc "sRGB.icc"
Windows ImageMagick 7: 필요 시 --magick "magick.exe 경로"
기존 --inspection / --document / --source-dir 개별 지정도 지원합니다.
원본은 보존하며 PDF 생성·최종 인쇄 승인은 별도입니다.`;
const args=process.argv.slice(2),options={};
try {
 if(args.length===1&&args[0]==='--help'){console.log(usage);}else{
 const allowed=new Set(['bundle-dir','inspection','document','source-dir','output-dir','icc','icc-sha256','srgb-icc','magick']);
 for(let i=0;i<args.length;i+=2){const name=args[i]?.slice(2);if(!args[i]?.startsWith('--')||!allowed.has(name)||!args[i+1]||args[i+1].startsWith('--')||Object.hasOwn(options,name))throw Error('옵션 이름·중복·파일 경로를 확인해 주세요.');options[name]=args[i+1];}
 if(options['bundle-dir']){
  if(['inspection','document','source-dir'].some(name=>options[name]))throw Error('--bundle-dir와 개별 입력 경로는 함께 지정할 수 없습니다.');
  options.inspection=path.join(options['bundle-dir'],'inspection.json');options.document=path.join(options['bundle-dir'],'document.json');options['source-dir']=path.join(options['bundle-dir'],'originals');
 }
 for(const name of ['inspection','document','source-dir','output-dir','icc','icc-sha256','srgb-icc'])if(!options[name])throw Error(`필수 옵션: --${name}`);
 const manifest=await prepareProductionCmykImages({inspection:JSON.parse(await readFile(options.inspection,'utf8')),document:JSON.parse(await readFile(options.document,'utf8')),sourceDir:options['source-dir'],outputDir:options['output-dir'],iccPath:options.icc,expectedIccSha256:options['icc-sha256'],srgbProfilePath:options['srgb-icc'],magickCommand:options.magick,onProgress:p=>console.log(`[${p.completed}/${p.total}] ${p.status==='converting'?'변환 시작':'변환 완료'} ${p.source}`)});
 console.log(`교정 버전 ${manifest.revisionId}: CMYK 파생 이미지 ${manifest.derived.length}개 준비. 결과: ${path.resolve(options['output-dir'],'manifest.json')}. 최종 인쇄 승인과 PDF 생성은 별도입니다.`);
 }
}catch(error){console.error(`CMYK 준비 중단: ${error.message}\n${usage}`);process.exitCode=1;}
