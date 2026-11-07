(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 function number(value,min=0,max=100){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('벡터 좌표가 올바르지 않습니다.');return value}
 function path(value){
  if(typeof value!=='string'||value.length>12000||!/^[\s\d.,+eE\-MLCQAZmlcqaz]+$/.test(value)||!/^\s*M/.test(value))throw Error('벡터 경로가 올바르지 않습니다.');
  const tokens=value.match(/[MLCQAZmlcqaz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
  let i=0;const sizes={M:2,L:2,C:6,Q:4,A:7,Z:0};
  while(i<tokens.length){const command=tokens[i++],size=sizes[command];if(size===undefined)throw Error('절대 좌표 벡터 경로만 지원합니다.');const values=[];while(i<tokens.length&&!/^[MLCQAZmlcqaz]$/.test(tokens[i]))values.push(number(Number(tokens[i++]),-100,200));if(size===0?values.length:!values.length||values.length%size)throw Error('벡터 경로 좌표가 부족합니다.');if(command==='A')for(let j=0;j<values.length;j+=7)if(values[j]<0||values[j+1]<0||![0,1].includes(values[j+3])||![0,1].includes(values[j+4]))throw Error('벡터 호가 올바르지 않습니다.');}
  return value;
 }
 function normalize(input){
  if(input?.schemaVersion!=='graphic-vector-object.v1'||input.coordinateSize?.width!==100||input.coordinateSize?.height!==100||!Array.isArray(input.colors)||input.colors.length!==4||input.colors.some(c=>typeof c!=='string'||!/^#[0-9a-f]{6}$/i.test(c))||!Array.isArray(input.parts)||input.parts.length<1||input.parts.length>80)throw Error('지원하는 벡터 개체가 아닙니다.');
  const parts=input.parts.map(p=>{if(!['path','rect','circle','ellipse'].includes(p.type)||![-1,0,1,2,3].includes(p.fill)||![-1,0,1,2,3].includes(p.stroke))throw Error('벡터 도형·색상을 확인해주세요.');const out={type:p.type,fill:p.fill,stroke:p.stroke};if(p.type==='path')out.d=path(p.d);else for(const key of p.type==='rect'?['x','y','width','height','rx']:p.type==='circle'?['cx','cy','r']:['cx','cy','rx','ry'])out[key]=number(p[key]);return out});
  const mask=input.mask?{type:'path',d:path(input.mask.d)}:null;
  return {schemaVersion:input.schemaVersion,coordinateSize:{width:100,height:100},physicalSizeMm:{width:number(input.physicalSizeMm?.width,1,500),height:number(input.physicalSizeMm?.height,1,500)},parts,mask,colors:input.colors.map(c=>c.toUpperCase()),strokeWidth:number(input.strokeWidth,0,10)};
 }
 function svg(input){const o=normalize(input),paint=p=>`fill="${p.fill<0?'none':o.colors[p.fill]}" stroke="${p.stroke<0?'none':o.colors[p.stroke]}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">${o.parts.map(p=>p.type==='path'?`<path d="${p.d}" ${paint(p)}/>`:p.type==='circle'?`<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" ${paint(p)}/>`:p.type==='ellipse'?`<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}" ${paint(p)}/>`:`<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" rx="${p.rx}" ${paint(p)}/>`).join('')}</svg>`}
 function placement(graphic,pageSize={width:260,height:180}){
  if(graphic.status!=='active'||graphic.illustrationCategory==='frame')throw Error('사용중인 일러스트를 선택해주세요. 사진 프레임 연결은 별도로 지원합니다.');
  const object=normalize(graphic.vectorObject);if(!(pageSize.width>0&&pageSize.height>0))throw Error('페이지 규격을 확인해주세요.');
  const width=object.physicalSizeMm.width/pageSize.width*100,height=object.physicalSizeMm.height/pageSize.height*100;
  return {type:'vector',role:'graphic-library-illustration',assetId:'graphic-library-vector',x:50-width/2,y:50-height/2,width,height,colors:{graphicVectorObject:clone(object)},style:{graphicVectorObject:clone(object)},value:{graphicVectorObject:clone(object)},graphicSource:{id:graphic.id,name:graphic.name,originalAssetId:graphic.originalAssetId,version:graphic.revision??graphic.createdAt},permissions:{move:true,resize:true,rotate:true,color:false,delete:true,duplicate:true,layer:true,content:false},printIntent:{schemaVersion:'print-object-intent.v1',sourceObjectType:'vector',structure:'runtime-expansion-required',expansionTarget:'native-primitives',directPdfMapping:false}};
 }
 root.ACDLGraphicVectorObject=Object.freeze({normalize,svg,placement});
})(typeof window==='undefined'?globalThis:window);
