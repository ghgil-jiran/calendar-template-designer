import type {SchoolInput,ScheduleEvent} from '../api/contracts';
export type MaterialDraft={school:SchoolInput;events:ScheduleEvent[]};
export function updateSchoolField(input:SchoolInput,key:string,value:string):SchoolInput{return {...input,values:{...input.values,[key]:value},cleared:value.trim()?(input.cleared||[]).filter(k=>k!==key):[...new Set([...(input.cleared||[]),key])]};}
// The committed state is replaced only after durable persistence succeeds.
export async function commitMaterials(draft:MaterialDraft,persist:(value:MaterialDraft)=>Promise<boolean>,apply:(value:MaterialDraft)=>void){const captured=structuredClone(draft);if(!await persist(captured))return false;apply(captured);return true;}

import type {PhotoAssignment,PhotoSlot} from '../api/contracts';
import type {PhotoFile} from '../../features/materials/photo-input';
import type {EditorState} from './session';
export type SchoolImageDraft={binding:string;photo:PhotoFile};
export function stageSchoolImages(photos:PhotoFile[],assignments:Record<string,PhotoAssignment>,slots:PhotoSlot[],editorState:EditorState|undefined,images:SchoolImageDraft[]){
 const nextPhotos=[...photos],nextAssignments={...assignments};
 for(const {binding,photo} of images){const index=nextPhotos.findIndex(p=>p.id===photo.id);if(index<0)nextPhotos.push(photo);else nextPhotos[index]=photo;for(const slot of slots.filter(s=>s.binding===binding))nextAssignments[slot.id]={photoId:photo.id,url:photo.url};}
 const changedIds=new Set(images.flatMap(i=>slots.filter(s=>s.binding===i.binding).map(s=>s.elementId)));
 return {photos:nextPhotos,assignments:nextAssignments,editorState:editorState?{...editorState,edits:editorState.edits.flatMap(e=>{if(!changedIds.has(e.elementId))return [e];const {photoId,photoCopy,fit,...rest}=e;return Object.keys(rest).length>3?[rest]:[];})}:undefined};
}
