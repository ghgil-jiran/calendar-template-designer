import type {PhotoCategory} from '../api/contracts';
export type UploadPhoto={id:string;file:File;url:string;width:number;height:number;category?:PhotoCategory};
export async function addPhotoFiles(photos:UploadPhoto[],files:File[],category:PhotoCategory){
 const next=[...photos],errors:string[]=[],created:string[]=[];let total=photos.reduce((sum,p)=>sum+p.file.size,0);
 for(const file of files){let url='';try{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG·PNG·WebP 형식으로 선택해 주세요.');
  if(!file.size||file.size>25*1024*1024)throw Error('사진 한 장은 25MB 이하로 선택해 주세요.');
  const duplicate=next.findIndex(p=>p.file.name===file.name&&p.file.size===file.size&&p.file.lastModified===file.lastModified);if(duplicate>=0){if(next[duplicate].category!==category)next[duplicate]={...next[duplicate],category:next[duplicate].category?'both':category};continue;}
  if(next.length>=50)throw Error('사진은 프로젝트 전체에서 최대 50장까지 보관할 수 있어요.');if(total+file.size>250*1024*1024)throw Error('사진 합계는 250MB 이하로 선택해 주세요.');
  const image=await createImageBitmap(file,{imageOrientation:'from-image'}),width=image.width,height=image.height;image.close();if(!width||!height||width*height>100000000)throw Error('사진 크기는 1억 화소 이하로 선택해 주세요.');
  url=URL.createObjectURL(file);created.push(url);next.push({id:crypto.randomUUID(),file,url,width,height,category});total+=file.size;
 }catch(error){if(url)URL.revokeObjectURL(url);errors.push(`${file.name}: ${error instanceof Error?error.message:'사진을 읽지 못했습니다.'}`);}}
 return {photos:next,errors,created};
}
