"""Reproducible Sample C authoring recipe. Base is a clean 28-surface contract."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]; assets=root/'assets/sample-c';p=json.loads((root/'scripts/sample-c/base-project.json').read_text());palettes=json.loads((root/'scripts/sample-c/palettes.json').read_text());E=p['book']['elementsByPage']
def text(id,x,y,w,h,content,size=16,color='#224c2b',binding=None,align='center',font='Pretendard',weight=400,**extra):
 e={'id':'c.'+id,'type':'text','x':x,'y':y,'width':w,'height':h,'zIndex':4,'content':content,'style':{'fontFamily':font,'fontSize':size,'fontWeight':weight,'color':color,'textAlign':align,'verticalAlign':'middle','background':False,'lineHeight':1.2},**extra}
 if binding:e['binding']=binding;e['bindingEnabled']=True
 return e
def shape(id,x,y,w,h,fill,radius=False):return {'id':'c.'+id,'type':'shape','role':'background-decoration','x':x,'y':y,'width':w,'height':h,'zIndex':1,'shapeType':'rounded' if radius else 'rect','style':{'fill':fill,'stroke':'transparent','strokeWidth':0}}
def image(id,x,y,w,h,key,role='decoration',binding=None):
 e={'id':'c.'+id,'type':'image-frame','role':role,'x':x,'y':y,'width':w,'height':h,'zIndex':3,'fit':'contain','frameType':'rect','image':{'src':'__ASSET:'+key+'__','fit':'contain'},'style':{'background':False,'strokeWidth':0}}
 if binding:e['image']['binding']=binding
 return e
def identity(prefix,x,y,w,h,size=18):
 return [image(prefix+'.logo',x,y,h*180/260,h,'logo','school-logo','school.profile.logo'),text(prefix+'.name',x+h*180/260+1,y,w-h*180/260-1,h*.62,p['book']['school']['name'],size,'#202020','school.name','left',weight=700),text(prefix+'.english',x+h*180/260+1,y+h*.62,w-h*180/260-1,h*.35,p['book']['school'].get('englishName','JIRAN MIDDLE SCHOOL'),size*.43,'#555555','school.englishName','left')]
s=p['book']['school']
E['surface.1.front']=[text('cover.motto',29,24,42,5,'사랑을 실천하는 교육',17,binding='school.slogan',weight=500),text('cover.year',27,30,46,22,'2027',125,binding='calendar.year',font='Bodoni Moda',weight=500),text('cover.calendar',33,53,34,6,'C A L E N D A R',23,font='Playfair Display'),*identity('cover',18,89,25,7.5,17),shape('cover.divider',46,88.5,.12,8,'#777777'),text('cover.address',49,89,44,2.8,s['address'],7.5,'#333333','school.address','left'),text('cover.contacts',49,92,44,2.8,'교무실 · 행정실 · 팩스',7.4,'#333333','school.contacts','left'),text('cover.website',49,95,44,2.2,s.get('website','schoolp.co.kr'),7.4,'#333333','school.website','left')]
E['surface.1.back']=[text('annual.year',28,12,23,9,'2027',42,binding='calendar.year',font='Playfair Display',weight=700),text('annual.label',51,13,25,7,'CALENDAR',23,font='Playfair Display'),{'id':'c.annual','type':'year-calendar','x':11,'y':25,'width':78,'height':64,'zIndex':3,'columns':4,'baseYear':2027,'startMonth':1,'monthCount':12,'weekStart':'sunday','rowsMode':'6','layoutType':'open-grid','monthLabelStyle':'number-en','showWeekdayHeader':False,'showAdjacentMonths':False,'style':{'fontFamily':'Pretendard','titleSize':15,'dateSize':10,'dateColor':'#222222','primary':'#315a34','sunday':'#db5353','saturday':'#222222','background':False,'titleAlign':'left','dayGridStyle':'none'}}]
sy=[text('symbols.heading',24,9,52,10,'우리학교 상징',32,'#664725',weight=700)]
def pill(id,x,y,w,label):return [shape(id+'.pill',x,y,w,4.7,'#34752b',True),text(id+'.label',x,y,w,4.7,label,14,'#ffffff',weight=700)]
sy+=pill('motto',11,25,33,'교훈');sy+=[shape('motto.box',11,31,33,12,'#edf2d0',True),text('motto.value',12,32,31,10,s['profile']['motto']['description'],18,'#235c31','school.profile.motto.description',weight=700)]
for key,x,label in [('tree',11,'교목'),('flower',29,'교화')]:
 sy+=pill(key,x,48,15,label);sy+=[image(key+'.photo',x,54,15,21,key,'school-'+key,'school.profile.'+key),text(key+'.name',x-1,77,17,4.2,s['profile'][key]['name'],16,'#34752b','school.profile.'+key+'.name',weight=700),text(key+'.description',x-1,82,17,8,s['profile'][key]['description'],11,'#222222','school.profile.'+key+'.description')]
sy+=pill('song',51,25,35,s['name']+' 교가');sy[-1].update({'binding':'school.name','bindingEnabled':True,'format':'school-song-title'});sy+=[image('song.score',50,32,38,57,'song','school-song','school.profile.song')];E['surface.2.front']=sy
E['surface.14.back']=[*identity('back',30,40,43,12,28),text('back.address',17,56,66,4,s['address'],10,'#333333','school.address'),text('back.contacts',20,61,60,4,'교무실 · 행정실 · 팩스',10,'#333333','school.contacts'),text('back.website',20,66,60,4,s.get('website','schoolp.co.kr'),10,'#333333','school.website')]
cal=p['template']['masters']['calendar'];cal['design'].update({'gridStyle':'top-rules','weekdayStyle':'filled-tabs','monthTitleStyle':'number-inline','monthTitleAlign':'center','verticalLayout':{'title':0,'weekday':5,'grid':95}})
cal['calendarRegion']={'x':5.2,'y':24.5,'width':89.6,'height':65.5};layout=cal['calendarLayout'];layout['regions']={'titlePercent':0,'weekdayPercent':4,'dateGridPercent':96};layout['fixedGeometry']['titlePercent']=0
layout['monthTitle']={'id':'master.monthly.title','schemaVersion':'monthly-title-object.v1','frame':{'x':39,'y':15,'width':23,'height':10},'style':{'fontFamily':'Playfair Display','numberFontFamily':'Bodoni Moda','numberSize':54,'yearSize':20,'englishSize':14,'yearColor':'#222222','englishColor':'#888888','gap':10,'numberFontWeight':400,'yearFontWeight':400,'englishFontWeight':400}}
app=layout['gridAppearance'];app.update({'dateFont':'Playfair Display','dateSize':12,'dateColor':'#777777','weekdayFont':'Playfair Display','weekdaySize':9,'weekdayColor':'#222222','lineColor':'#777777','lineWidth':.5,'datePadding':3,'weekdayRuleWidth':0,'sundayBackground':'#ffffff','saturdayBackground':'#ffffff','mini':{'mode':'solid','color':'#f2f8df','opacity':100}})
cal['showAdjacentMonths']=False;cal['calendarOverrides'].update({'cellPaddingX':2,'cellPaddingY':2});cal['eventMaxVisiblePerDay']=2
colors=['#a4cd39','#c48ac1','#69b853','#5dbbc7','#3a97c4','#377dac','#ba9b59','#b5743b','#a27656','#b66e83','#78909a','#a3a687']
p['template']['resources']['colorTheme'].update({'primary':'#a4cd39','secondary':'#777777','holiday':'#e85b50','weekend':'#81c5e7','line':'#777777','background':'#ffffff'})
p['book']['monthlyStyleOverrides']=[]
for i in range(12):
 month=(i+2)%12+1;year=2027+(i>=10);key=f'{year}-{month:02d}';accent=palettes[i]['accent'];bg=palettes[i]['background']
 p['book']['monthlyStyleOverrides'].append({'monthKey':key,'tokens':{'primary':colors[i]}})
 front=next(q for q in p['book']['pageInstances'] if q['role']=='monthly-front' and q['monthKey']==key)
 E[front['id']]=[image(key+'.ornament',5.4,16,8.5,7.5,f'ornament-{i+1:02d}'),text(key+'.motto',15,17.5,23,5,'슬기롭게, 화목하게, 튼튼하게',11,'#555555','school.profile.motto.description','left',font='Nanum Myeongjo'),*identity(key+'.identity',83,17.5,12,5,10)]
 back=next(q for q in p['book']['pageInstances'] if q['role']=='monthly-back' and q['monthKey']==key)
 elems=[shape(key+'.planner.bg',-3/260*100,-3/180*100,266/260*100,186/180*100,bg),shape(key+'.planner.panel',2.8,10.5,94.4,84.5,'#ffffff'),image(key+'.planner.icon',87,3,7.5,10.5,f'planner-icon-{i+1:02d}')]
 for role,x,y,w,h,title,kind in [('week',7,13,86,33,'WEEKLY PLANNER','weekly-columns'),('goal',7,49,24.5,43,'MONTHLY GOAL','striped-checklist'),('todo',33,49,24.5,43,'TO DO LIST','striped-checklist'),('memo',60.2,49,32.8,43,'MEMO','split-notes')]:
  elems.append({'id':'c.'+key+'.'+role,'type':'memo','role':'monthly-'+role,'x':x,'y':y,'width':w,'height':h,'zIndex':3,'memoLayout':kind,'title':title,'itemCount':11,'style':{'color':accent,'lineColor':accent,'stripeColor':bg,'fontFamily':'Arial'}})
 E[back['id']]=elems
# Limited shared user editing policy; no structure/planner/calendar edits.
blocked={k:False for k in ['move','color','layer','delete','resize','rotate','content','imageFit','duplicate','replaceImage']}
for page in p['book']['pageInstances']:
 for e in E[page['id']]:
  e['permissions']=dict(blocked);e['userEditingSchemaVersion']='template-user-editing.v1'
  if e.get('binding','').startswith('school.') and page['role']!='monthly-front':e['permissions'].update({'move':True,'resize':True,'content':True})
  if e.get('role','').startswith('school-') and e['type']=='image-frame':e['permissions'].update({'replaceImage':True,'imageFit':True});e['userReplaceable']=True;e['replacementPolicy']='replace-source-preserve-frame'
assets.joinpath('project.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('Sample C authored:',len(p['book']['pageInstances']),'surfaces',sum(len(v)for v in E.values()),'objects')
