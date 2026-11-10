/* Shared calendar grid style contract for authoring and Runtime screens. */
(function (root) {
  "use strict";
  const version = "1.0.0-preview.1";
  const classes = Object.freeze({
    "open-rows": "grid-open-rows",
    "top-rules": "grid-top-rules",
    "row-underlines": "grid-row-underlines",
    minimal: "grid-minimal",
    "detached-cards": "grid-detached-cards",
    boxed: "grid-boxed",
  });
  function resolve(style) {
    if (style != null && style !== "" && !Object.hasOwn(classes, style)) {
      throw new Error(`Unsupported calendar grid style: ${String(style)}`);
    }
    const kind = style || "boxed";
    return Object.freeze({ kind, className: classes[kind] });
  }
  function normalizeAppearance(input={}){
    input=input&&typeof input==='object'?input:{};
    const result={schemaVersion:'calendar-grid-appearance.v1'};
    for(const key of ['weekday','date','mini']){
      const value=input[key]||{};
      result[key]={mode:(key==='mini'?['inherit','transparent','solid']:['transparent','solid']).includes(value.mode)?value.mode:key==='mini'?'inherit':'transparent',color:/^#[0-9a-f]{6}$/i.test(value.color)?value.color:'#ffffff',opacity:Number.isFinite(Number(value.opacity))?Math.max(0,Math.min(100,Number(value.opacity))):100};
    }
    for(const key of ['weekdaySize','dateSize','lineWidth'])if(input[key]!==''&&input[key]!=null&&Number.isFinite(Number(input[key])))result[key]=Math.max(key==='lineWidth'?0:3,Math.min(key==='lineWidth'?8:72,Number(input[key])));
    for(const key of ['weekdayRadius','datePadding'])if(input[key]!==''&&input[key]!=null&&Number.isFinite(Number(input[key])))result[key]=Math.max(0,Math.min(20,Number(input[key])));
    for(const key of ['weekdayColor','dateColor','lineColor'])if(/^#[0-9a-f]{6}$/i.test(input[key]))result[key]=input[key];
    for(const key of ['weekdayFont','dateFont'])if(typeof input[key]==='string'&&/^[a-zA-Z0-9 -]{1,80}$/.test(input[key]))result[key]=input[key];
    for(const key of ['sundayBackground','saturdayBackground','weekdayRuleColor'])if(/^#[0-9a-f]{6}$/i.test(input[key]))result[key]=input[key];
    result.frameMode=input.frameMode==='internal'?'internal':'boxed';
    if(input.weekdayRuleWidth!==''&&input.weekdayRuleWidth!=null&&Number.isFinite(Number(input.weekdayRuleWidth)))result.weekdayRuleWidth=Math.max(0,Math.min(8,Number(input.weekdayRuleWidth)));
    return result;
  }
  function appearanceVariables(input,weekStart='sunday'){
    if(!input||typeof input!=='object'||input.schemaVersion&&input.schemaVersion!=='calendar-grid-appearance.v1')return {};
    if(!Object.keys(input).some(key=>['schemaVersion','weekday','date','mini','weekdaySize','dateSize','lineWidth','weekdayRadius','datePadding','weekdayColor','dateColor','lineColor','weekdayFont','dateFont','sundayBackground','saturdayBackground','weekdayRuleColor','weekdayRuleWidth','frameMode'].includes(key)))return {};
    const s=normalizeAppearance(input),paint=v=>v.mode==='transparent'?'transparent':`rgba(${parseInt(v.color.slice(1,3),16)},${parseInt(v.color.slice(3,5),16)},${parseInt(v.color.slice(5,7),16)},${v.opacity/100})`,date=paint(s.date);
    const vars={'--calendar-weekday-background':paint(s.weekday),'--calendar-date-background':date,'--calendar-mini-background':s.mini.mode==='inherit'?date:paint(s.mini)};
    for(const key of ['weekdaySize','dateSize','lineWidth'])if(s[key]!=null)vars['--calendar-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=s[key]+'px';
    for(const key of ['weekdayRadius','datePadding'])if(s[key]!=null)vars['--calendar-authored-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=s[key]+'px';
    for(const key of ['weekdayColor','dateColor','lineColor','weekdayFont','dateFont'])if(s[key])vars['--calendar-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=s[key];
    if(s.sundayBackground||s.saturdayBackground)for(let i=0;i<7;i++){const day=(i+(weekStart==='monday'?1:0))%7;vars['--calendar-weekday-bg-'+(i+1)]=day===0&&s.sundayBackground?s.sundayBackground:day===6&&s.saturdayBackground?s.saturdayBackground:paint(s.weekday);}
    if(s.frameMode==='internal')vars['--calendar-outer-line-width']='0px';
    if(s.weekdayRuleWidth!=null)vars['--calendar-weekday-rule-width']=s.weekdayRuleWidth+'px';if(s.weekdayRuleColor)vars['--calendar-weekday-rule-color']=s.weekdayRuleColor;
    return vars;
  }
  const api = Object.freeze({ version, resolve, normalizeAppearance, appearanceVariables });
  root.ACDLSharedGridPresentation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);


