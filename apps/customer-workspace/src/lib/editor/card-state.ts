import {updateSchoolField} from './materials.ts';
import type {SchoolInput} from '../api/contracts';
export type SchoolFieldDraft={value:string;hidden:boolean};
export function fieldChanged(school:SchoolInput,key:string,draft:SchoolFieldDraft){return draft.value!==(school.values[key]??'')||draft.hidden!==school.hidden.includes(key);}
export function applyFieldDrafts(school:SchoolInput,drafts:Record<string,SchoolFieldDraft>,keys:string[]):SchoolInput{
 let next=structuredClone(school);
 for(const key of keys){const draft=drafts[key];if(!draft)continue;next=updateSchoolField(next,key,draft.value);next.hidden=draft.hidden?[...new Set([...next.hidden,key])]:next.hidden.filter(k=>k!==key);}
 return next;
}
