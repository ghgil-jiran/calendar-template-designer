import type {SchoolInput,ScheduleEvent} from '../api/contracts';
export type MaterialDraft={school:SchoolInput;events:ScheduleEvent[]};
export function updateSchoolField(input:SchoolInput,key:string,value:string):SchoolInput{return {...input,values:{...input.values,[key]:value},cleared:value.trim()?(input.cleared||[]).filter(k=>k!==key):[...new Set([...(input.cleared||[]),key])]};}
// The committed state is replaced only after durable persistence succeeds.
export async function commitMaterials(draft:MaterialDraft,persist:(value:MaterialDraft)=>Promise<boolean>,apply:(value:MaterialDraft)=>void){const captured=structuredClone(draft);if(!await persist(captured))return false;apply(captured);return true;}
