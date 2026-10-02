/* Shared kind defaults and validation. Values are millimetres from the trim page. */
(function(root){
 const schemaVersion='monthly-front-defaults.v1';
 const frames={
  'desk-standard':{x:13,y:45,width:234,height:120},
  'desk-large':{x:15,y:52,width:267,height:143},
  'desk-wide':{x:15,y:40,width:267,height:95},
  'desk-portrait':{x:12,y:67,width:156,height:174}
 };
 const clone=value=>JSON.parse(JSON.stringify(value));
 function initial(id){return frames[id]?{schemaVersion,gridFrameMm:{...frames[id]},weekdayHeightMm:7,weekdayGapMm:0}:null}
 function normalize(value){
  if(value==null)return null;
  const frame=value.gridFrameMm||{};
  return {schemaVersion:value.schemaVersion,gridFrameMm:{x:frame.x,y:frame.y,width:frame.width,height:frame.height},weekdayHeightMm:value.weekdayHeightMm,weekdayGapMm:value.weekdayGapMm};
 }
 function validate(value,size){
  if(value==null)return [];
  const errors=[],frame=value.gridFrameMm||{},numeric=n=>typeof n==='number'&&Number.isFinite(n);
  if(value.schemaVersion!==schemaVersion)errors.push('월력 앞면 기본 배치 형식을 확인해 주세요.');
  if(!['x','y','width','height'].every(key=>numeric(frame[key]))||frame.x<0||frame.y<0||!(frame.width>0&&frame.height>0))errors.push('격자 위치는 0 이상, 폭과 높이는 0보다 커야 합니다.');
  else if(frame.x+frame.width>Number(size?.width)+1e-6||frame.y+frame.height>Number(size?.height)+1e-6)errors.push('월 격자는 완성 규격 안에 배치해 주세요.');
  if(!numeric(value.weekdayHeightMm)||!numeric(value.weekdayGapMm)||!(value.weekdayHeightMm>0)||value.weekdayGapMm<0||value.weekdayHeightMm+value.weekdayGapMm>=frame.height)errors.push('요일 높이와 간격은 격자 높이보다 작아야 합니다.');
  return errors;
 }
 function applyNewProject(project,type,composition){
  if(type?.family?.id!=='desk'||!type.monthlyFrontDefaults)return false;
  const value=type.monthlyFrontDefaults,size=project.productType?.pageSize,errors=validate(value,size);
  if(errors.length)throw new Error(errors.join(' '));
  const page=project.book?.pageInstances?.find(page=>page.role==='monthly-front')||{role:'monthly-front'};
  const content=composition.contentFrame(project,page),toContent=frame=>composition.contentRelativeFrame({x:frame.x/size.width*100,y:frame.y/size.height*100,width:frame.width/size.width*100,height:frame.height/size.height*100},content);
  const calendar=project.template.masters.calendar,layout=calendar.calendarLayout||{},frame=value.gridFrameMm;
  // Establish the title separately before the first editor render. Never subtract it from the grid.
  const top=Math.max(0,Math.min(frame.y-1,Math.max(size.height*content.y/100,Math.min(frame.y*.35,16)))),titleFrame={x:frame.x,y:top,width:frame.width,height:Math.max(1,frame.y-top-4)};
  calendar.calendarRegion=toContent(frame);
  calendar.calendarLayout={...layout,fixedGeometry:{schemaVersion:'monthly-grid-geometry.v1',titlePercent:0,weekdayTrackMm:value.weekdayHeightMm+value.weekdayGapMm,weekdayGapMm:value.weekdayGapMm,measurementSpace:'trim-page'},monthTitle:{schemaVersion:'monthly-title-object.v1',id:'master.monthly.title',...layout.monthTitle,frame:toContent(titleFrame)}};
  calendar.monthlyFrontDefaultsSource={typeId:type.id,definition:clone(value)};
  return true;
 }
 root.ACDLMonthlyFrontDefaults=Object.freeze({schemaVersion,initial,normalize,validate,applyNewProject});
})(typeof window!=='undefined'?window:globalThis);
