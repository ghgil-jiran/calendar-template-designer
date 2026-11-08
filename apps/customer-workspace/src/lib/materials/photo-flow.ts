import type {PhotoAssignment,PhotoSelections,PhotoSlot} from '../api/contracts';
export function slotsForPhotoPage(slots:PhotoSlot[],pageId:string){return slots.filter(s=>s.scope!=='school'&&(s.pageIds||[s.pageId]).includes(pageId));}
export function applyPhotoSelections(assignments:Record<string,PhotoAssignment>,selections:PhotoSelections,ids:string[]){const next={...assignments},pending={...selections};for(const id of ids){if(!(id in pending))continue;const value=pending[id];if(value)next[id]=value;else delete next[id];delete pending[id];}return {assignments:next,selections:pending};}
