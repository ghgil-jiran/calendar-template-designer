import { createHash } from 'node:crypto';

const ASSET_MARKER=/^acdl-asset:\/\/([0-9a-f-]{36})$/i;

function collectAssetIds(value,result=new Set()){
  if(typeof value==='string'){
    const match=value.match(ASSET_MARKER);if(match)result.add(match[1]);
  }else if(Array.isArray(value))value.forEach(item=>collectAssetIds(item,result));
  else if(value&&typeof value==='object')Object.values(value).forEach(item=>collectAssetIds(item,result));
  return result;
}

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
  return value;
}

function expectedMonths(year,startMonth=3){
  return Array.from({length:12},(_,index)=>{
    const offset=startMonth-1+index;
    return `${year+Math.floor(offset/12)}-${String(offset%12+1).padStart(2,'0')}`;
  });
}

export function inspectWallTemplate(template,version){
  const project=version?.projectData||{},pages=project?.book?.pageInstances||[],size=project?.productType?.pageSize||{};
  const months=pages.filter(page=>page.role==='monthly-front').map(page=>page.monthKey||`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`);
  const expected=expectedMonths(Number(template.edition)||Number(project?.settings?.year)||2028,Number(project?.settings?.startMonth)||3);
  const roles=pages.map(page=>page.role);
  const checks=[
    {id:'product-type',label:'벽걸이형 제품',ok:template.productType==='wall'&&project?.productType?.category==='wall'},
    {id:'page-size',label:'A3 세로 297 × 420 mm',ok:Number(size.width)===297&&Number(size.height)===420&&String(size.unit||'mm')==='mm'},
    {id:'surface-count',label:'총 15면',ok:pages.length===15},
    {id:'surface-order',label:'표지·앞간지·월력 12면·뒷표지 순서',ok:roles[0]==='cover-front'&&roles[1]==='front-insert-front'&&roles.slice(2,14).every(role=>role==='monthly-front')&&roles[14]==='back-cover-front'},
    {id:'month-order',label:'3월부터 다음 해 2월까지 월 순서',ok:months.length===12&&months.every((month,index)=>month===expected[index])},
    {id:'insert-contract',label:'앞간지 1면·뒤간지 0면·고정 뒷표지',ok:Number(project?.settings?.frontInsertCount)===1&&Number(project?.settings?.rearInsertCount||0)===0&&roles[14]==='back-cover-front'}
  ];
  const assetIds=[...collectAssetIds(project)].sort();
  const fingerprint=createHash('sha256').update(JSON.stringify(stable(project))).digest('hex');
  return {
    ok:checks.every(check=>check.ok),
    template:{id:template.id,name:template.name,edition:template.edition,state:template.state,latestVersionNumber:template.latestVersionNumber},
    version:{id:version.id,versionNumber:version.versionNumber,createdAt:version.createdAt},
    summary:{surfaceCount:pages.length,pageSize:{width:size.width,height:size.height,unit:size.unit||'mm'},roles,months,assetCount:assetIds.length,assetIds,projectSha256:fingerprint},
    checks,
    blockers:checks.filter(check=>!check.ok).map(check=>check.label)
  };
}

export function inspectTemplatePackage(template,version){
  if(template?.productType==='wall')return inspectWallTemplate(template,version);
  const project=version?.projectData||{},pages=project?.book?.pageInstances||[],size=project?.productType?.pageSize||{};
  const roles=pages.map(page=>page.role),monthly=pages.filter(page=>page.role==='monthly-front');
  const checks=[
    {id:'system-base',label:'시스템 베이스 확정',ok:template?.isStandard===true&&template?.state==='ready'},
    {id:'project-document',label:'저장된 프로젝트 문서',ok:Boolean(project?.book)&&pages.length>0},
    {id:'product-type',label:'제품 유형 일치',ok:Boolean(template?.productType)&&project?.productType?.category===template?.productType},
    {id:'page-size',label:'유효한 페이지 크기',ok:Number(size.width)>0&&Number(size.height)>0&&Boolean(size.unit||'mm')},
    {id:'monthly-pages',label:'월력 앞면 12개',ok:monthly.length===12},
    {id:'cover-order',label:'표지와 뒷표지 포함',ok:roles[0]==='cover-front'&&roles.some(role=>role==='back-cover-front')}
    ,{id:'classification',label:'템플릿 분류 계약',ok:project?.template?.classification?.schemaVersion==='template-classification.v1'&&Boolean(project?.template?.classification?.compositionType)&&Boolean(project?.template?.classification?.designStyle)}
    ,{id:'user-input',label:'사용자 입력 안내 계약',ok:project?.template?.userInput?.schemaVersion==='template-user-input.v1'&&Array.isArray(project?.template?.userInput?.requiredInputs)&&project?.template?.userInput?.recommendedFlow==='quick-order'&&project?.template?.userInput?.supportsOptionalEditing===true&&project?.template?.userInput?.userServiceCapabilities?.includes('add-text')&&project?.template?.userInput?.userServiceCapabilities?.includes('add-image')}
  ];
  const assetIds=[...collectAssetIds(project)].sort();
  const fingerprint=createHash('sha256').update(JSON.stringify(stable(project))).digest('hex');
  return {ok:checks.every(check=>check.ok),template:{id:template.id,name:template.name,edition:template.edition,state:template.state,isStandard:template.isStandard,latestVersionNumber:template.latestVersionNumber},version:{id:version.id,versionNumber:version.versionNumber,createdAt:version.createdAt},summary:{surfaceCount:pages.length,pageSize:{width:size.width,height:size.height,unit:size.unit||'mm'},roles,monthCount:monthly.length,assetCount:assetIds.length,assetIds,projectSha256:fingerprint},checks,blockers:checks.filter(check=>!check.ok).map(check=>check.label)};
}
