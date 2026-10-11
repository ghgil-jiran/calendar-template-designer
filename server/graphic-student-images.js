import {readFileSync} from 'node:fs';
import {curatedId} from './graphic-curated-library.js';
import thumbnails from './graphic-student-image-thumbnails.js';
import calendarItems from './graphic-student-calendar-data.js';
import calendarThumbnails from './graphic-student-calendar-thumbnails.js';

const sources=[new URL('../assets/student-image-prototypes/student-wave-01.png',import.meta.url),new URL('../assets/student-image-prototypes/student-wave-02.png',import.meta.url)];
// Raster references belong to the student theme, independently of its editable vector slots.
export async function installStudentImages({records,createRecord,storeAsset,validateThumbnail}){
 const added=[],themeId=curatedId('theme:students'),theme=records.find(r=>r.id===themeId);
 if(!theme||theme.status!=='active')return added;
 for(const [index,url] of sources.entries()){
  const id=curatedId('asset:student-image-prototype-'+(index+1));
  if(records.some(r=>r.id===id))continue;
  const bytes=readFileSync(url),asset=await storeAsset('data:image/png;base64,'+bytes.toString('base64')),now=new Date().toISOString();
  added.push(await createRecord({schemaVersion:'graphic-library.v1',id,name:`학생 · 손 흔드는 여학생 ${String(index+1).padStart(2,'0')} · PNG`,category:'illustration',illustrationCategory:'school',themeId,themeName:theme.name,width:1024,height:1536,mimeType:'image/png',byteSize:bytes.length,fileName:`student-wave-0${index+1}.png`,originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(thumbnails[index]),tags:'학생, 여학생, 교복, 가방, 손인사, PNG, 표지 포인트',source:'AI 생성 · 학생 스타일 비교 시안 · 원본 PNG',usageNotes:'표지·월 뒤 포인트 이미지용 스타일 시안. 300dpi 기준 최대 약 87 × 130mm. 작은 달력 장식용 단순화와 실제 PDF 출력은 별도 검토 필요.',generationInfo:{engine:'imagegen',edition:'student-image-prototypes-01',generatedAt:now},status:'active',parentGraphicId:null,revision:1,createdAt:now,updatedAt:now}));
 }
 for(const [index,item] of calendarItems.entries()){
  const id=curatedId('asset:student-calendar-01-'+item.key);
  if(records.some(r=>r.id===id))continue;
  const bytes=readFileSync(new URL('../assets/student-calendar-illustrations/'+item.fileName,import.meta.url));
  const asset=await storeAsset('data:image/png;base64,'+bytes.toString('base64')),now=new Date().toISOString();
  added.push(await createRecord({schemaVersion:'graphic-library.v1',id,name:`학생 · ${item.name} 01 · PNG`,category:'illustration',illustrationCategory:'school',themeId,themeName:theme.name,width:item.width,height:item.height,mimeType:'image/png',byteSize:bytes.length,fileName:item.fileName,originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(calendarThumbnails[index]),tags:`학생, 중학생, 고등학생, 학교생활, ${item.name}, 투명 배경, PNG`,source:'AI 생성 · 학사달력 학생 일러스트 8종',usageNotes:`투명 배경 전신 일러스트. 300dpi 기준 원본 캔버스 약 ${Math.floor(item.width/300*25.4)} × ${Math.floor(item.height/300*25.4)}mm. 최종 배치 크기의 해상도와 CMYK PDF 출력은 별도 확인.`,generationInfo:{engine:'imagegen',edition:'student-calendar-01',generatedAt:now},status:'active',parentGraphicId:null,revision:1,createdAt:now,updatedAt:now}));
 }
 return added;
}
