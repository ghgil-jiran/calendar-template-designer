export function createSaveQueue(){let pending:Promise<unknown>=Promise.resolve();return <T>(job:()=>Promise<T>)=>{const next=pending.catch(()=>{}).then(job);pending=next;return next;};}
