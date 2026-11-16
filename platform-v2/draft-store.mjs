import {assertCandidateUnchanged} from './migration-candidate.mjs';

export const DRAFT_RESOURCE='calendar_v2_migration_drafts';
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function checkedId(id){if(!idPattern.test(id||''))throw new Error('Invalid V2 draft ID');return id;}
function conflict(){return Object.assign(new Error('Draft changed; reload before saving'),{code:'V2_DRAFT_CONFLICT'});}

// Transport must address only the isolated V2 resource; never import legacy persistence.
export function createMigrationDraftStore({request}){
  if(typeof request!=='function')throw new Error('Explicit V2 transport required');
  return {
    async load(id){
      const rows=await request(`${DRAFT_RESOURCE}?id=eq.${checkedId(id)}&select=*`,{method:'GET'});
      if(!Array.isArray(rows))throw new Error('Invalid draft response');
      if(!rows.length)return null;
      assertCandidateUnchanged(rows[0].candidate);return structuredClone(rows[0]);
    },
    async save({id,candidate,expectedRevision}){
      checkedId(id);assertCandidateUnchanged(candidate);
      if(candidate.state!=='review-required'||candidate.publishable!==false||candidate.executable!==false)throw new Error('Only blocked migration candidates may be stored');
      if(!Number.isInteger(expectedRevision)||expectedRevision<0)throw new Error('Explicit expected revision required');
      const body={candidate:structuredClone(candidate),revision:expectedRevision+1};
      const create=expectedRevision===0;
      if(create)body.id=id;
      let rows;
      try{rows=await request(create?DRAFT_RESOURCE:`${DRAFT_RESOURCE}?id=eq.${id}&revision=eq.${expectedRevision}`,{
        method:create?'POST':'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)
      });}catch(error){if(error.statusCode===409||error.status===409)throw conflict();throw error;}
      if(!Array.isArray(rows)||rows.length!==1)throw conflict();
      assertCandidateUnchanged(rows[0].candidate);return structuredClone(rows[0]);
    }
  };
}
