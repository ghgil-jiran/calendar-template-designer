/* Shared, authored photo openings. Coordinates scale with the photo box. */
(function(root){
 'use strict';
 const catalog=[
 ['rect','사각 사진','M0 0 H100 V100 H0 Z'],
 ['rounded','둥근 사진','M16 0 H84 Q100 0 100 16 V84 Q100 100 84 100 H16 Q0 100 0 84 V16 Q0 0 16 0 Z'],
 ['circle','원형 사진','M50 0 C77.614 0 100 22.386 100 50 C100 77.614 77.614 100 50 100 C22.386 100 0 77.614 0 50 C0 22.386 22.386 0 50 0 Z'],
 ['ellipse','타원 사진','M50 0 C77.614 0 100 22.386 100 50 C100 77.614 77.614 100 50 100 C22.386 100 0 77.614 0 50 C0 22.386 22.386 0 50 0 Z'],
 ['arch','아치 사진','M0 100 V50 C0 22 22 0 50 0 C78 0 100 22 100 50 V100 Z'],
 ['hexagon','육각 사진','M25 0 H75 L100 50 L75 100 H25 L0 50 Z'],
 ['star','별 사진','M50 0 L61 34 L98 35 L68 57 L79 94 L50 72 L21 94 L32 57 L2 35 L39 34 Z'],
 ['heart','하트 사진','M50 96 C15 72 0 48 5 25 C10 2 38 0 50 20 C62 0 90 2 95 25 C100 48 85 72 50 96 Z'],
 ['capsule','캡슐 사진','M25 0 H75 C89 0 100 22 100 50 C100 78 89 100 75 100 H25 C11 100 0 78 0 50 C0 22 11 0 25 0 Z'],
 ['octagon','팔각 사진','M20 0 H80 L100 20 V80 L80 100 H20 L0 80 V20 Z'],
 ['cut-corners','모서리 절삭 사진','M10 0 H90 L100 10 V90 L90 100 H10 L0 90 V10 Z'],
 ['diagonal-rounded','대각 둥근 사진','M22 0 H100 V78 Q100 100 78 100 H0 V22 Q0 0 22 0 Z'],
 ['top-rounded','상단 둥근 사진','M20 0 H80 Q100 0 100 20 V100 H0 V20 Q0 0 20 0 Z'],
 ['bottom-arch','하단 아치 사진','M0 0 H100 V50 C100 78 78 100 50 100 C22 100 0 78 0 50 Z'],
 ['droplet','물방울 사진','M50 0 C68 25 96 43 96 66 C96 87 76 100 50 100 C24 100 4 87 4 66 C4 43 32 25 50 0 Z'],
 ['leaf','잎사귀 사진','M0 100 C0 35 35 0 100 0 C100 65 65 100 0 100 Z'],
 ['organic','비대칭 곡선 사진','M33 2 C57 0 86 4 96 29 C100 51 96 80 77 94 C55 100 20 100 7 78 C0 56 0 20 18 8 C23 4 28 3 33 2 Z'],
 ['ticket','티켓 사진','M0 0 H100 V35 C85 35 85 65 100 65 V100 H0 V65 C15 65 15 35 0 35 Z'],
 ['wave','물결 사진','M0 8 Q12 0 25 8 Q37 16 50 8 Q62 0 75 8 Q87 16 100 8 V92 Q87 100 75 92 Q62 84 50 92 Q37 100 25 92 Q12 84 0 92 Z'],
 ['petal','둥근 꽃잎 사진','M50 7 C65 0 82 0 86 17 C100 21 100 38 93 50 C100 65 100 82 83 86 C79 100 62 100 50 93 C35 100 18 100 14 83 C0 79 0 62 7 50 C0 35 0 18 17 14 C21 0 38 0 50 7 Z']
 ].map(([id,name,path])=>Object.freeze({id,name,path}));
 const get=id=>catalog.find(f=>f.id===id)||catalog[0];
 // Sample authored curves into proportional CSS points: avoids fixed-pixel CSS path clipping.
 function points(path){const tokens=path.match(/[MLHVQCZ]|-?\d+(?:\.\d+)?/g);let i=0,x=0,y=0;const out=[];while(i<tokens.length){const c=tokens[i++],n=()=>Number(tokens[i++]);if(c==='M'||c==='L'){x=n();y=n();out.push([x,y]);}else if(c==='H'){x=n();out.push([x,y]);}else if(c==='V'){y=n();out.push([x,y]);}else if(c==='Q'||c==='C'){const x0=x,y0=y,a=n(),b=n(),e=c==='C'?n():0,f=c==='C'?n():0,tx=n(),ty=n();for(let j=1;j<=24;j++){const t=j/24,u=1-t;out.push(c==='Q'?[u*u*x0+2*u*t*a+t*t*tx,u*u*y0+2*u*t*b+t*t*ty]:[u*u*u*x0+3*u*u*t*a+3*u*t*t*e+t*t*t*tx,u*u*u*y0+3*u*u*t*b+3*u*t*t*f+t*t*t*ty]);}x=tx;y=ty;}else if(c!=='Z')throw Error('Unsupported authored frame path');}return out;}
 const clips=Object.fromEntries(catalog.map(f=>[f.id,'polygon('+points(f.path).map(([x,y])=>`${x.toFixed(3)}% ${y.toFixed(3)}%`).join(',')+')']));
 const clip=id=>clips[get(id).id];
 function outline(id,color='#ffffff',width=3){color=/^#[0-9a-f]{3,8}$/i.test(color)?color:'transparent';width=Math.max(0,Math.min(20,Number(width)||0));return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" aria-hidden="true"><path d="${get(id).path}" fill="none" stroke="${color}" stroke-width="${width*2}" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;}
 root.ACDLPhotoFrameModel=Object.freeze({catalog,get,clip,outline});
})(globalThis);
