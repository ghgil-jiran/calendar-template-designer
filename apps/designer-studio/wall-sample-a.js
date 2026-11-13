(function(root){
 'use strict';
 const STABLE_KEY='poster-sample-a-floral-2027',NAME='2027학년도 · 벽보형 샘플 A · 플라워 1면형',REVISION='wall-sample-a.v1';
 function create(source={},definition,assets={}){
  const p=root.ACDLPosterOnePageSample.create(source,definition),ps=p.productType.pageSize;
  if(Number(ps.width)!==420||Number(ps.height)!==594)throw Error('벽보형 샘플 A는 A2 세로형 420 × 594mm 기준입니다.');
  p.template.metadata={...p.template.metadata,name:NAME,description:'수채화 플라워 배경 · A2 세로 1면 · 12개월 3열×4행 · 연결 학교 정보와 월별 일정 목록',posterSample:REVISION,backgroundEffectiveDpi:assets.effectiveDpi||62.9,backgroundPrintQuality:'not-verified'};
  p.settings.calendarRows=6;p.settings.calendarRowsMode='fixed';p.settings.calendarData={includeHolidays:true,includeAnniversaries:true,includeSolarTerms:true,includeLunar:false};
  p.template.settings={...p.template.settings,aiDesignDisabled:true,vectorBackgroundEnabled:false};delete p.template.settings.graphicPackage;
  const page=p.book.pageInstances[0];page.label='학사일정';page.overrides={backgroundColor:'#fff9f6'};
  const rights={move:true,resize:true,content:true,color:true,delete:true,duplicate:true,replaceImage:true,imageFit:true};
  const text=(id,binding,x,y,width,height,pt,content='',extra={})=>({id,type:'text',binding,bindingEnabled:!!binding,x,y,width,height,zIndex:3,content,permissions:{...rights,replaceImage:false,imageFit:false},style:{fontSize:pt*4/3,fontReferenceWidthPx:420*96/25.4,fontFamily:'Pretendard',color:'#587242',background:false,textAlign:'center',verticalAlign:'middle',fontWeight:700,padding:0,lineHeight:1.12,...extra}});
  const image=assets.background||'assets/wall-sample-a/background.png',logo=assets.logo||'assets/sample-school/jiran-logo.webp';
  const calendar={id:'wall-a.calendar',type:'year-calendar',label:'전체 월력',academicPoster:true,posterPolicyVersion:2,x:5,y:16,width:90,height:74,zIndex:1,columns:3,startMonth:3,monthCount:12,posterMonthOffset:0,rowsMode:'fixed',posterShowList:true,posterColors:['#eedbdc','#e1e8d7','#e8dfd4','#e5deea'],style:{fontFamily:'Pretendard',background:false},permissions:structuredClone(rights),wallCalendarSettings:root.ACDLWallCalendar.normalize({titlePt:24,weekdayPt:10,datePt:13,referencePt:7.5,eventPt:8.5,listPt:9,gapMm:4,paddingMm:1.5,lineMm:.15,listPercent:30,listColumns:2,gridStyle:'horizontal',showWeekdays:true,schedulePlacement:'list',referenceLayout:'below',fontFamily:'Pretendard',dateColor:'#343a32',sunday:'#bd605f',saturday:'#65804b'})};
  const background={id:'wall-a.background',type:'image',role:'graphic-package-background',label:'플라워 배경',src:image,fit:'contain',x:-3/420*100,y:-3/594*100,width:426/420*100,height:600/594*100,zIndex:0,locked:true,selectable:false,permissions:{},...(assets.pdfSource?{graphicSource:{packageId:assets.packageId,pdfSource:structuredClone(assets.pdfSource),previewAssetId:assets.previewAssetId},printIntent:{schemaVersion:'print-object-intent.v1',sourceObjectType:'pdf',structure:'pdf-source-embedding-required',directPdfMapping:false,locked:true}}:{}),metadata:{originalPixelWidth:1055,originalPixelHeight:1491,effectiveDpi:assets.effectiveDpi||62.9,printQuality:'not-verified'}};
  const logoFrame={x:24,y:94,width:4,height:4*420/594},name=text('wall-a.footer-name','school.name',30,93.8,39,1.7,16,'',{textAlign:'left',color:'#415b35'}),english=text('wall-a.footer-english','school.englishName',30,95.5,39,1.1,8,'',{textAlign:'left',fontWeight:400,color:'#6d7667'});
  name.metadata={logoGroupId:'wall-a.identity',logoPart:'name'};english.metadata={logoGroupId:'wall-a.identity',logoPart:'english'};
  p.book.elementsByPage[page.id]=[background,text('wall-a.name','school.name',25,4.8,50,4.3,36),text('wall-a.year','calendar.year',29,9.3,14,3,27,'',{color:'#bd6b61'}),text('wall-a.title','',43,9.3,34,3,24,'학년도 학사일정',{color:'#587242',textAlign:'left'}),text('wall-a.slogan','school.slogan',25,12.4,50,1.5,10.5,'',{fontWeight:400,color:'#7d826c'}),calendar,{id:'wall-a.logo',type:'image-frame',role:'school-logo',label:'교표 이미지',...logoFrame,zIndex:3,frameType:'rect',fit:'contain',image:{src:logo,binding:'school.profile.logo',fit:'contain',scale:1,offsetX:0,offsetY:0},style:{background:false,strokeWidth:0},permissions:structuredClone(rights),userReplaceable:true,metadata:{logoGroupId:'wall-a.identity',logoPart:'image',combinedFrame:{x:24,y:93.8,width:45,height:3.2}}},name,english,text('wall-a.address','school.address',30,96.7,40,1,7.5,'',{textAlign:'left',fontWeight:400,color:'#6d7667'}),text('wall-a.contacts','school.contacts',30,97.8,40,1.1,7.2,'',{textAlign:'left',fontWeight:400,color:'#6d7667'})];
  p.book.school.profile.logo={...p.book.school.profile.logo,image:logo};
  p.template.publishing.dataRequirements=p.template.publishing.dataRequirements.filter(r=>r.path!=='school.profile.building');
  p.template.resources.sampleAssets=p.template.resources.sampleAssets.filter(a=>a.role==='school-logo');
  p.template.resources.exportSettings={...p.template.resources.exportSettings,bleed:3,dpi:300};
  delete p.template.savedPagePreviews;delete p.template.thumbnail;
  root.ACDLNativePrintAuthoring?.initializeProject(p);return p;
 }
 root.ACDLWallSampleA=Object.freeze({STABLE_KEY,NAME,REVISION,create});
})(globalThis);
