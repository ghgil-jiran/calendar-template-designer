(()=>{
 const host=document.querySelector('[data-resource-content="colors"]');if(!host)return;
 const panel=document.createElement('section');panel.className='settings-card';panel.id='monthlyStyleSettings';host.append(panel);let initial='';
 const model=window.ACDLMonthlyStyleSettings,escape=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function refresh(){if(!project)return;const rows=model.rows(project);panel.hidden=!rows.length;if(!rows.length)return;
 const titleStyle=project.template?.masters?.calendar?.calendarLayout?.monthTitle?.style||{};
 panel.innerHTML='<h4>월별 스타일 · 월력 강조색</h4><p>배경 원본과 별도로 저장되는 월별 강조색입니다. 빈 값은 공통 Primary 색상을 사용합니다. 다른 개체에 직접 지정한 색상은 유지됩니다.</p>'+(titleStyle.numberColor?'<p>월 숫자에 공통 고정 색상이 지정되어 있습니다. 월별 강조색을 사용하려면 편집 화면의 월 표시 속성에서 월 숫자 색상을 비워 주세요.</p>':'')+'<div class="settings-grid">'+rows.map(r=>`<label>${r.year}년 ${r.month}월<input data-month-style="${escape(r.key)}" value="${escape(r.color)}" placeholder="${escape(r.fallback)}" pattern="#[a-fA-F0-9]{6}" aria-label="${r.month}월 강조색"></label>`).join('')+'</div><button type="button" id="saveMonthlyStyles" disabled>월별 스타일 적용</button><p id="monthlyStyleFeedback" role="status"></p>';
 const values=()=>[...panel.querySelectorAll('[data-month-style]')].map(n=>({key:n.dataset.monthStyle,color:n.value.trim()}));initial=JSON.stringify(values());panel.oninput=()=>{panel.querySelector('button').disabled=JSON.stringify(values())===initial};panel.querySelector('button').onclick=()=>{try{const data=values();if(data.some(v=>v.color&&!/^#[a-f0-9]{6}$/i.test(v.color)))throw Error('색상은 #RRGGBB 형식으로 입력해 주세요.');snapshot();model.apply(project,data);markDirty();render();initial=JSON.stringify(data);panel.querySelector('button').disabled=true;panel.querySelector('#monthlyStyleFeedback').textContent='월별 스타일을 적용했습니다. 템플릿 저장으로 확정해 주세요.';}catch(e){panel.querySelector('#monthlyStyleFeedback').textContent=e.message;}};
 }
 const original=switchResourcePage;switchResourcePage=function(key){const result=original.apply(this,arguments);if(key==='colors')refresh();return result};
})();
