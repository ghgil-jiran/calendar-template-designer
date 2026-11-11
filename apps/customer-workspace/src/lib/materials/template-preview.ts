import type {TemplateCard} from '../api/contracts';
// Signed package images already identify the saved preview; never rewrite their query.
export function largePreviewUrl(page:TemplateCard['pages'][number]):string|null{
 if(page.largeImageUrl)return page.largeImageUrl;
 const url=page.imageUrl;
 if(url?.startsWith('/api/workspace/previews/'))return url+(url.includes('?')?'&':'?')+'size=large';
 return url;
}

// Select by semantic role, not physical page number; small products keep their own page count.
export function majorPageNumbers(pages: {role?:string;semanticPageRole?:string;monthKey?:string;id?:string}[]):number[]{
 if(pages.length<=8)return pages.map((_,i)=>i+1);
 const chosen:number[]=[],take=(predicate:(p:typeof pages[number])=>boolean)=>{const i=pages.findIndex((p,i)=>!chosen.includes(i+1)&&predicate(p));if(i>=0)chosen.push(i+1);};
 take(p=>p.role==='cover-front'||p.role==='cover');take(p=>p.role==='cover-back'||p.semanticPageRole==='yearly-calendar');take(p=>p.semanticPageRole==='school-symbols'||p.role==='school-symbols'||p.role==='front-insert-front');
 for(let i=0;i<2;i++){take(p=>p.role==='monthly-front');take(p=>p.role==='monthly-back');}
 take(p=>String(p.role).startsWith('back-cover'));return chosen;
}
export function calendarKind(project: {productType?:{category?:string};settings?:{type?:string}}):'desk'|'poster'{return /poster|wall|single-sheet/.test(String(project.productType?.category||project.settings?.type))?'poster':'desk';}
