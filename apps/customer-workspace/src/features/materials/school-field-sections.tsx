import type {ReactNode} from 'react';
import {TextField} from '@/components/ui/text-field';
import {schoolFieldGroups} from '@/lib/materials/school-field-groups';
import type {SchoolField,SchoolInput} from '@/lib/api/contracts';
export function SchoolFieldSections({fields,school,errors,onChange,onHide,renderImage}:{fields:SchoolField[];school:SchoolInput;errors:Record<string,string>;onChange:(key:string,value:string)=>void;onHide:(key:string,hidden:boolean)=>void;renderImage?:(key:string)=>ReactNode}){
 const input=(field:SchoolField)=><TextField {...field} key={field.key} value={school.values[field.key]||''} hidden={school.hidden.includes(field.key)} allowHide={!field.required&&field.allowHide} hint={field.hint?.includes('연결된 글자 개체')?undefined:field.hint} error={errors[field.key]} onChange={value=>onChange(field.key,value)} onHide={hidden=>onHide(field.key,hidden)}/>;
 return <div className="school-field-sections">{schoolFieldGroups(fields).map(section=><section className="school-input-section" key={section.id}><h3>{section.title}</h3>{section.id==='symbols'?<div className="school-symbol-field-groups">{[['motto'],['treeName','treeDescription'],['flowerName','flowerDescription']].map(keys=>{const group=section.fields.filter(f=>keys.includes(f.key));return group.length>0&&<div className={`school-symbol-field-group ${keys[0]==='motto'?'text-only':''}`} key={keys[0]}><div className="school-symbol-field-copy">{group.map(input)}</div>{renderImage?.(keys[0])}</div>;})}</div>:<div className="form-grid">{section.fields.map(input)}</div>}</section>)}</div>;
}
