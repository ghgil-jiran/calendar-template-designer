window.ACDL_TEMPLATE_CATALOG={
  version:1,
  types:[
    {id:"desk",label:"탁상형 달력",description:"앞·뒷면과 월별 콘텐츠를 함께 구성하는 양면 달력입니다.",icon:"🗓️",enabled:true,sortOrder:1,baseType:"desk"},
    {id:"wall",label:"벽걸이형 달력",description:"학교 이미지와 큰 월력을 중심으로 구성하는 단면 달력입니다.",icon:"📅",enabled:true,sortOrder:2,baseType:"wall"},
    {id:"poster",label:"연간 포스터형",description:"한 장에서 연간 학사일정을 확인하는 벽보형 달력입니다.",icon:"▦",enabled:true,sortOrder:3,baseType:"poster"},
    {id:"postcard",label:"엽서형 달력",description:"표지와 12개월 월력을 카드처럼 구성하는 단면 달력입니다.",icon:"✉️",enabled:true,sortOrder:4,baseType:"postcard"}
  ],
  templates:[
    {id:"tpl-2028-desk-academic-standard-v1-1",name:"학사달력 표준 탁상형 · Runtime 정밀형",description:"사용자 서비스 대표 28면과 Runtime 비교로 확정한 정밀 배치 계약을 사용하는 review Sample Template입니다.",type:"desk",status:"ready",edition:2028,template:"desk-academic-standard",packageVersion:"1.1.0",packageBase:"/templates/desk-academic-standard/1.1.0/",features:["28면 표준 순서","정밀 layoutContract","5×7 월력"],pageSummary:"표지·연간·학교 상징·월력 12면·사진/메모 12면·끝지",updatedAt:"2026-08-23T00:00:00.000Z",version:1},
    {id:"tpl-2028-wall-academic-standard-v0-1",name:"벽걸이형 표준 01 · 이미지 월력형",description:"A3 세로 앞표지 1면·앞간지 1면·3월부터 다음 해 2월까지 사진+월력 12면·뒷표지 1면을 편집·저장하는 review Sample Template입니다.",type:"wall",status:"ready",edition:2028,template:"wall-academic-standard",packageVersion:"0.1.0",packageBase:"/templates/wall-academic-standard/0.1.0/",features:["A3 세로 15면","앞간지·뒷표지","상단 월별 이미지","단면 월력"],pageSummary:"앞표지 1면·앞간지 1면·월력 12면·뒷표지 1면",updatedAt:"2026-08-26T00:00:00.000Z",version:1},
    {id:"tpl-2027-desk-sample-6",name:"탁상형 6번 · 월별 플래너형",description:"박스형 월력과 기간 일정, 월별 플래너, 학교 상징을 함께 검증하는 v2 대표 템플릿입니다.",type:"desk",status:"published",edition:2027,template:"desk-sample-6",features:["기간 일정","월별 플래너","28면 앞뒤 구성"],pageSummary:"표지·연력·학교 상징·월별 앞뒤 12쌍·뒷표지",updatedAt:"2026-08-05T00:00:00.000Z",version:2},
    {id:"tpl-2027-desk-sample-2",name:"탁상형 2번 · 이미지 콜라주형",description:"월별 이미지 콜라주와 띠력, 사진 교체를 검증하는 v2 대표 템플릿입니다.",type:"desk",status:"published",edition:2027,template:"desk-sample-2",features:["이미지 콜라주","띠력","월별 사진 교체"],pageSummary:"표지·연력·학교 상징·월별 앞뒤 12쌍·뒷표지",updatedAt:"2026-08-05T00:00:00.000Z",version:2},
    {id:"tpl-2027-basic-desk",name:"학교 기본형",description:"학교 전경과 교표, 월별 학사일정을 균형 있게 보여주는 표준 탁상형 템플릿입니다.",type:"desk",status:"published",edition:2027,template:"school-basic",features:["학교 정보 강조","5×7·6×7"],pageSummary:"표지·월력 12장·뒷면",updatedAt:"2026-07-27T00:00:00.000Z",version:1},
    {id:"tpl-2027-minimal-desk",name:"사진 미니멀형",description:"월별 대표 사진과 월력을 간결하게 배치한 현대적인 탁상형 템플릿입니다.",type:"desk",status:"published",edition:2027,template:"minimal",features:["사진 중심","6×7"],pageSummary:"표지·월력 12장·뒷면",updatedAt:"2026-07-26T00:00:00.000Z",version:1},
    {id:"tpl-2027-wall",name:"학교 이미지형",description:"상단 학교 이미지와 넓은 월력을 사용하는 벽걸이형 기본 템플릿입니다.",type:"wall",status:"published",edition:2027,template:"school-basic",features:["큰 월력","전경 강조"],pageSummary:"표지·월력 12장",updatedAt:"2026-07-25T00:00:00.000Z",version:1},
    {id:"tpl-2027-poster",name:"연간 일정 포스터",description:"연간 학사일정을 한눈에 확인하도록 구성한 포스터형 템플릿입니다.",type:"poster",status:"published",edition:2027,template:"school-basic",features:["연간 보기","행사 중심"],pageSummary:"연간 월력 1장",updatedAt:"2026-07-24T00:00:00.000Z",version:1},
    {id:"tpl-2027-postcard",name:"월별 사진 엽서형",description:"표지와 12개월 월력을 한 장씩 구성하고 각 월의 사진과 월력을 편집하는 엽서형 템플릿입니다.",type:"postcard",status:"published",edition:2027,template:"minimal",features:["12개월 카드","사진 중심"],pageSummary:"표지·월력 12장·뒷표지",updatedAt:"2026-07-28T00:00:00.000Z",version:1},
    {id:"tpl-2026-basic",name:"학교 기본형",description:"이전 연도 운영 기록을 위해 보관된 2026 Edition입니다.",type:"desk",status:"archived",edition:2026,template:"school-basic",features:["보관본","학교 정보 강조"],pageSummary:"표지·월력 12장·뒷면",updatedAt:"2025-11-30T00:00:00.000Z",version:1}
  ]
};
