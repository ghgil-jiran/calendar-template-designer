import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import '../../apps/designer-studio/native-print-authoring.js';
import {documentHash} from '../../server/production-corrections.js';

const run=promisify(execFile),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const within=(parent,child)=>{const rel=path.relative(parent,child);return rel===''||!rel.startsWith(`..${path.sep}`)&&rel!=='..'&&!path.isAbsolute(rel);};
export function inspectProductionIcc(bytes,expectedSha){
 expectedSha=String(expectedSha||'').toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(expectedSha||'')||sha(bytes)!==expectedSha)throw Error('출력 ICC의 지정 SHA-256과 실제 파일이 일치하지 않습니다.');
 if(bytes.length<132||bytes.toString('ascii',36,40)!=='acsp'||bytes.toString('ascii',16,20)!=='CMYK'||bytes.readUInt32BE(0)!==bytes.length)throw Error('유효한 CMYK ICC 프로파일이 필요합니다.');
 const count=bytes.readUInt32BE(128),descriptions=[];
 if(132+count*12>bytes.length)throw Error('ICC 태그 테이블이 손상되었습니다.');
 for(let i=0;i<count;i++){const pos=132+i*12;if(bytes.toString('ascii',pos,pos+4)!=='desc')continue;const offset=bytes.readUInt32BE(pos+4),size=bytes.readUInt32BE(pos+8);if(offset+size>bytes.length||size<12)throw Error('ICC 설명 태그가 손상되었습니다.');const type=bytes.toString('ascii',offset,offset+4);
  if(type==='desc'){const n=bytes.readUInt32BE(offset+8);if(n<1||12+n>size)throw Error('ICC 설명 길이가 올바르지 않습니다.');descriptions.push(bytes.toString('ascii',offset+12,offset+12+n).replace(/\0/g,''));}
  else if(type==='mluc'){const n=bytes.readUInt32BE(offset+8),recordSize=bytes.readUInt32BE(offset+12);if(recordSize<12||16+n*recordSize>size)throw Error('ICC 다국어 설명이 손상되었습니다.');for(let j=0;j<n;j++){const p=offset+16+j*recordSize,len=bytes.readUInt32BE(p+4),start=bytes.readUInt32BE(p+8);if(start+len>size||len%2)throw Error('ICC 설명 범위가 올바르지 않습니다.');let text='';for(let k=0;k<len;k+=2)text+=String.fromCharCode(bytes.readUInt16BE(offset+start+k));descriptions.push(text);}}
 }
 if(!descriptions.some(text=>/Japan\s*Color\s*2011\s*Coated/i.test(text)))throw Error('Japan Color 2011 Coated 원본 ICC가 필요합니다. 다른 CMYK 프로파일로 대체하지 않습니다.');
 return {sha256:expectedSha,outputConditionIdentifier:'Japan Color 2011 Coated'};
}

// Image-only color conversion; text/vector/PDF content never enters this path.
export async function convertRasterToCmyk(sourcePath,outputPath,iccPath,{runCommand=run,srgbProfilePath,magickCommand=process.platform==='win32'?'magick':null}={}){
 const invoke=(command,args,options)=>runCommand(magickCommand||command,magickCommand?[command,...args]:args,options);
 const info=await invoke('identify',['-format','%n|%[opaque]|%[orientation]|%[profiles]|%[colorspace]',sourcePath],{timeout:30000,maxBuffer:4096});
 const [frames,opaque,orientation,profiles,colorSpace]=info.stdout.trim().split('|');
 if(frames!=='1'||opaque.toLowerCase()!=='true')throw Error('투명 또는 다중 프레임 이미지는 알파 보존 출력 연결 후 처리해야 합니다. 흰 배경으로 자동 합성하지 않습니다.');
 if(!['Undefined','TopLeft'].includes(orientation))throw Error('EXIF 회전 이미지의 화면·인쇄 방향 연결이 필요합니다.');
 const args=[sourcePath];
 if(!profiles.toLowerCase().includes('icc')){
  if(!['srgb','rgb'].includes(String(colorSpace).toLowerCase()))throw Error('입력 ICC가 없는 비RGB 원본의 색상 조건을 확인해야 합니다.');
  if(!srgbProfilePath)throw Error('프로파일 없는 RGB 원본은 명시적인 sRGB 입력 ICC가 필요합니다.');
  const inputIcc=await readFile(srgbProfilePath);if(inputIcc.length<128||inputIcc.toString('ascii',36,40)!=='acsp'||inputIcc.toString('ascii',16,20)!=='RGB ')throw Error('sRGB 입력 프로파일은 유효한 RGB ICC여야 합니다.');
  args.push('-profile',srgbProfilePath);
 }
 args.push('-profile',iccPath,'-quality','95',outputPath);
 await invoke('convert',args,{timeout:120000,maxBuffer:4096});
 const bytes=await readFile(outputPath),infoJpeg=globalThis.ACDLNativePrintAuthoring.inspectJpeg(bytes);
 if(!infoJpeg.valid||infoJpeg.components!==4)throw Error('변환 결과가 4채널 CMYK JPEG가 아닙니다.');
 return {bytes,info:infoJpeg,inputProfileBasis:profiles.toLowerCase().includes('icc')?'embedded-icc':'explicit-srgb',...(!profiles.toLowerCase().includes('icc')?{inputIccSha256:sha(await readFile(srgbProfilePath))}:{}),engine:'imagemagick-lcms'};
}

export async function prepareProductionCmykImages({inspection,document,sourceDir,outputDir,iccPath,expectedIccSha256,srgbProfilePath,magickCommand,onProgress=()=>{},convertImage=convertRasterToCmyk}){
 if(inspection?.schemaVersion!=='production-image-inspection.v1'||!inspection.revisionId||!inspection.plan?.contentHash||inspection.plan.revisionId!==inspection.revisionId||inspection.plan.documentHash!==inspection.documentHash)throw Error('교정 버전과 연결된 원본 검사 기록이 필요합니다.');
 if(!document||documentHash(document)!==inspection.plan.contentHash)throw Error('동결된 교정 문서가 검사 당시 내용과 일치하지 않습니다.');
 const icc=inspectProductionIcc(await readFile(iccPath),expectedIccSha256),sourceRoot=await realpath(sourceDir),output=path.resolve(outputDir);
 const outputParent=await realpath(path.dirname(output)),finalOutput=path.join(outputParent,path.basename(output));
 if(within(sourceRoot,finalOutput)||within(finalOutput,sourceRoot))throw Error('CMYK 파생 파일은 원본과 분리된 폴더에 저장해야 합니다.');
 const reports=inspection.results||[],sources=inspection.plan.sources;
 if(!Array.isArray(sources)||sources.length>100||new Set(sources).size!==sources.length||reports.length!==sources.length)throw Error('사용 원본 목록이 검사 결과와 일치하지 않습니다.');
 for(const source of sources){const rows=reports.filter(r=>r.source===source),r=rows[0];if(rows.length!==1||r.message||r.contentHash!==inspection.plan.contentHash||r.revisionId!==inspection.revisionId||r.documentHash!==inspection.documentHash||!/^production-asset:\/\/[a-f0-9-]{36}$/i.test(source)||!/^[a-f0-9]{64}$/.test(r.sourceHash||''))throw Error('미검사 또는 다른 버전의 원본은 CMYK 변환할 수 없습니다.');}
 // Exclusive directory creation prevents overwriting any existing output.
 await mkdir(finalOutput);
 await writeFile(path.join(finalOutput,'pending.json'),JSON.stringify({revisionId:inspection.revisionId,contentHash:inspection.plan.contentHash}),{flag:'wx'});
 const derived=[];
 let activeSource=null;
 try {
 for(const source of sources){
  activeSource=source;
  await onProgress({status:"converting",completed:derived.length,total:sources.length,source});const report=reports.find(r=>r.source===source),id=source.slice(19),file=await realpath(path.join(sourceRoot,id));if(!within(sourceRoot,file))throw Error('원본 파일 경로가 보관 폴더 밖을 가리킵니다.');const bytes=await readFile(file);if(sha(bytes)!==report.sourceHash||bytes.length!==report.byteSize)throw Error('검사 당시 원본 SHA-256 또는 크기가 일치하지 않습니다.');
  const filename=`${id}.cmyk.jpg`,result=await convertImage(file,path.join(finalOutput,filename),iccPath,{srgbProfilePath,magickCommand});
  if(result.info.width!==report.pixelWidth||result.info.height!==report.pixelHeight)throw Error('변환 과정에서 원본 픽셀 크기가 바뀌었습니다.');
  derived.push({source,sourceHash:report.sourceHash,sha256:sha(result.bytes),file:filename,mimeType:'image/jpeg',colorSpace:'cmyk',pixelWidth:result.info.width,pixelHeight:result.info.height,icc,inputProfileBasis:result.inputProfileBasis,inputIccSha256:result.inputIccSha256||null,engine:result.engine,placements:report.placements,conversionStatus:'prepared',finalApproved:false});
 await onProgress({status:'converted',completed:derived.length,total:sources.length,source});
 }
 } catch(error) {
  await writeFile(path.join(finalOutput,'failure.json'),JSON.stringify({schemaVersion:'production-cmyk-failure.v1',revisionId:inspection.revisionId,contentHash:inspection.plan.contentHash,status:'failed',failedSource:activeSource,completed:derived.length,total:sources.length,message:error.message,finalApproved:false},null,2),{flag:'wx'});
  throw error;
 }
 const manifest={schemaVersion:'production-cmyk-images.v1',requestId:inspection.requestId,revisionId:inspection.revisionId,documentHash:inspection.documentHash,contentHash:inspection.plan.contentHash,icc,derived,status:'prepared',finalApproved:false};
 // A pending directory without this manifest is never a usable print resource.
 await writeFile(path.join(finalOutput,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
 return manifest;
}
