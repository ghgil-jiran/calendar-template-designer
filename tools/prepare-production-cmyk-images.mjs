import {readFile} from 'node:fs/promises';
import {prepareProductionCmykImages} from './lib/production-cmyk-images.mjs';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){if(!args[i]?.startsWith('--')||!args[i+1])throw Error('각 옵션의 파일 경로를 지정해 주세요.');options[args[i].slice(2)]=args[i+1];}
for(const name of ['inspection','document','source-dir','output-dir','icc','icc-sha256','srgb-icc'])if(!options[name])throw Error(`필수 옵션: --${name}`);
const manifest=await prepareProductionCmykImages({inspection:JSON.parse(await readFile(options.inspection,'utf8')),document:JSON.parse(await readFile(options.document,'utf8')),sourceDir:options['source-dir'],outputDir:options['output-dir'],iccPath:options.icc,expectedIccSha256:options['icc-sha256'],srgbProfilePath:options['srgb-icc'],magickCommand:options.magick});
console.log(`교정 버전 ${manifest.revisionId}: CMYK 파생 이미지 ${manifest.derived.length}개 준비. 최종 인쇄 승인과 PDF 생성은 별도입니다.`);
