(function(root){
 // Measure the existing common editor output. This module never renders a page.
 function capture(use,box,{imageSource,readStyle}={}){
  if(!box||Number(use.rotation||0)!==0)throw Error('회전 또는 누락된 복합 개체의 이미지 영역을 확인하지 못했습니다.');
  const media=box.querySelector('.semantic-media'),image=media?.querySelector('img');
  if(!image||imageSource!==use.source||!image.complete||!image.naturalWidth)throw Error('저장 원본과 표시된 이미지가 일치하지 않습니다.');
  const outer=box.getBoundingClientRect(),inner=media.getBoundingClientRect(),style=readStyle(image);
  if(style.transform&&style.transform!=='none'||!['cover','contain'].includes(style.objectFit))throw Error('이 이미지의 배치 변환은 아직 측정할 수 없습니다.');
  if(![outer.width,outer.height,inner.width,inner.height].every(v=>Number.isFinite(v)&&v>0))throw Error('이미지 영역 크기를 확인하지 못했습니다.');
  const f=use.frameMm;
  return {pageId:use.pageId,objectId:use.objectId,source:use.source,basis:'common-editor-dom.v1',fit:style.objectFit,scale:1,frameMm:{x:f.x+(inner.left-outer.left)/outer.width*f.width,y:f.y+(inner.top-outer.top)/outer.height*f.height,width:inner.width/outer.width*f.width,height:inner.height/outer.height*f.height}};
 }
 root.ACDLPrintImageLayout=Object.freeze({capture});
})(typeof window!=='undefined'?window:globalThis);
