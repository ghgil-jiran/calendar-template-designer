(function(){
 const section=key=>document.querySelector(`[data-resource-content="${key}"]`);
 function disabled(){return project?.template?.settings?.aiDesignDisabled===true}
 function wrap(key){const page=section(key);if(!page)return null;let content=page.querySelector(':scope > .ai-optional-content');if(!content){content=document.createElement('div');content.className='ai-optional-content';[...page.children].filter(item=>item.tagName!=='H3').forEach(item=>content.append(item));page.append(content)}return content}
 const design=section('design-types'),options=wrap('design-types'),generation=wrap('ai-design');
 if(!design||!generation)return;
 const label=document.createElement('label');label.className='settings-card';label.style.display='block';
 label.innerHTML='<input id="noAIDesignCheckbox" type="checkbox"> AI 디자인 생성 없음';design.insertBefore(label,options);
 const note=document.createElement('div');note.className='settings-card hidden';note.innerHTML='<h4>기본 구성으로 편집 시작</h4><p>페이지 설정을 기준으로 월력·학교 정보·메모·사진 프레임을 배치합니다. 편집 화면에서 사진과 디자인을 추가할 수 있습니다.</p><p id="noAIDesignSummary"></p>';section('ai-design').append(note);
 const checkbox=label.querySelector('input');
 function refresh(){const off=disabled();checkbox.checked=off;options.classList.toggle('hidden',off);generation.classList.toggle('hidden',off);note.classList.toggle('hidden',!off);if(off){const data=window.ACDLAIDesignSettings.summary(project);note.querySelector('#noAIDesignSummary').textContent=`${data.productType} · ${data.pageSize} · ${data.pageCount}면`;const enter=el('newTemplateEnterEditorBtn');if(enter&&newTemplateSetupInProgress){enter.textContent='편집 시작';enter.disabled=false}}}
 checkbox.addEventListener('change',()=>{if(aiDesignGenerationState==='generating'||aiMonthlyExpansionState==='generating'){checkbox.checked=disabled();showEditorToast('생성이 완료되거나 중지된 뒤 변경해 주세요.');return}project.template.settings||={};project.template.settings.aiDesignDisabled=checkbox.checked;stable();updateNewTemplateSettingsActions();refresh()});
 const actions=updateNewTemplateSettingsActions;updateNewTemplateSettingsActions=function(){actions();refresh()};
 const switchPage=switchResourcePage;switchResourcePage=function(page){const result=switchPage(page);refresh();return result};
 window.ACDLNoAIDesign={disabled,refresh};refresh();
})();

async function startTemplateEditorWithoutAI(){
 if(!newTemplateSetupInProgress)return;
 const before=structuredClone(project),button=el('newTemplateEnterEditorBtn');
 try{
  button.disabled=true;
  const spec=window.ACDLDesignSpec.read(project,window.ACDLDesignTypeCatalog);
  prepareNeutralAIDesignBase({selectedVariantId:'none',variants:[{id:'none',assetsByRole:{cover:null,annual:null,divider:null,month:null,'month-back':null,'back-cover':null},monthlyAssets:{}}]});
  const layout=window.ACDLDesignLayoutApplication.apply(project,spec);
  const back=window.ACDLMonthBackComposition.applyConfigured(spec);
  for(const page of project.book.pageInstances||[]){for(const item of project.book.elementsByPage[page.id]||[]){if(item.type!=='image-frame')continue;const schoolBound=item.binding?.startsWith('school.')||item.image?.binding?.startsWith('school.');if(schoolBound)continue;item.image={...(item.image||{}),src:'',binding:'',sampleFallback:false};item.emptyBehavior='placeholder';item.replaceable=true;item.mediaPurpose='user-replaceable-photo';item.style={...(item.style||{}),background:'#eef2f7',stroke:'#cbd5e1',strokeWidth:1}}}
  project.template.aiDesignDraft={status:'not-requested',generationMode:'none',layoutApplication:layout,monthBackApplication:back};
  project.template.metadata={...(project.template.metadata||{}),state:'draft',isStandard:false};
  newTemplateSetupInProgress=false;document.body.classList.remove('resource-modal-open');el('resourceModal').classList.add('hidden');updateNewTemplateSettingsActions();setEditorContext('새 템플릿 만들기 · 기본 구성');stable();render();window.ACDLReturnToLibraryOnSaveCancel=true;showEditorToast('페이지 설정의 기본 개체와 사진 프레임으로 편집을 시작했습니다.');
 }catch(error){project=before;showEditorToast(error.message||'편집 화면을 시작하지 못했습니다.');updateNewTemplateSettingsActions()}
}
