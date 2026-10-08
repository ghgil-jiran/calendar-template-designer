(function(root){
  "use strict";
  const version = "0.1.0-preview.1";
  const escapeText = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const VECTOR_LIBRARY=[
 {id:"school-building",name:"학교 건물",category:"school",icon:"🏫"},{id:"book-open",name:"펼친 책",category:"school",icon:"📖"},{id:"pencil",name:"연필",category:"school",icon:"✎"},{id:"ruler",name:"자",category:"school",icon:"📏"},{id:"globe",name:"지구본",category:"school",icon:"🌐"},{id:"board",name:"칠판",category:"school",icon:"▰"},{id:"graduation-cap",name:"졸업모",category:"school",icon:"🎓"},{id:"school-bell",name:"학교 종",category:"school",icon:"🔔"},{id:"backpack",name:"책가방",category:"school",icon:"🎒"},{id:"school-bus",name:"스쿨버스",category:"school",icon:"🚌"},{id:"microscope",name:"현미경",category:"school",icon:"🔬"},{id:"flask",name:"플라스크",category:"school",icon:"⚗"},
 {id:"cherry-blossom",name:"벚꽃",category:"season",icon:"✿"},{id:"sprout",name:"새싹",category:"season",icon:"🌱"},{id:"leaf",name:"나뭇잎",category:"season",icon:"🍃"},{id:"sun",name:"여름 해",category:"season",icon:"☀"},{id:"cloud",name:"구름",category:"season",icon:"☁"},{id:"rain",name:"빗방울",category:"season",icon:"💧"},{id:"maple",name:"단풍",category:"season",icon:"🍁"},{id:"snow",name:"눈송이",category:"season",icon:"❄"},
 {id:"entrance",name:"입학식",category:"event",icon:"🎒"},{id:"graduation",name:"졸업식",category:"event",icon:"🎓"},{id:"sports",name:"운동회",category:"event",icon:"🏃"},{id:"festival",name:"학교 축제",category:"event",icon:"🎉"},{id:"field-trip",name:"체험학습",category:"event",icon:"🚌"},{id:"exam",name:"시험",category:"event",icon:"📝"},{id:"vacation",name:"방학",category:"event",icon:"🏖"},{id:"counsel",name:"상담",category:"event",icon:"💬"},
 {id:"laurel",name:"월계수",category:"decoration",icon:"❧"},{id:"badge",name:"배지",category:"decoration",icon:"⬟"},{id:"corner",name:"코너 장식",category:"decoration",icon:"⌜"},{id:"wave",name:"물결 장식",category:"decoration",icon:"〰"}
];
  function vectorColor(value, fallback) {
    return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
  }
  function renderVectorSvg(assetId, colors = {}) {
    if(assetId==='graphic-package-background')return root.ACDLGraphicTemplateMapping?root.ACDLGraphicTemplateMapping.svg(colors):"";
    const asset = VECTOR_LIBRARY.find(item => item.id === assetId);
    if (!asset) return "";
    const primary = vectorColor(colors?.primary, "#4777bd");
    const secondary = vectorColor(colors?.secondary, "#f4b740");
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="' + escapeText(asset.name) + '">' +
      '<circle cx="50" cy="50" r="44" fill="' + secondary + '" opacity=".22"/>' +
      '<path d="M50 5 L58 35 L90 35 L64 54 L74 86 L50 67 L26 86 L36 54 L10 35 L42 35 Z" fill="' + primary + '" opacity=".12"/>' +
      '<text x="50" y="61" text-anchor="middle" font-size="44" font-family="Arial, sans-serif" fill="' + primary + '">' + escapeText(asset.icon) + '</text></svg>';
  }
  function supportsVectorAsset(assetId) { return assetId==='graphic-package-background'?Boolean(root.ACDLGraphicTemplateMapping):VECTOR_LIBRARY.some(item => item.id === assetId); }
  const api = Object.freeze({ version, renderVectorSvg, supportsVectorAsset });
  root.ACDLSharedVector = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
