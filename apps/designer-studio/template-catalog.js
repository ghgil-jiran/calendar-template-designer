window.ACDL_TEMPLATE_CATALOG={
  version:1,
  types:[
    {id:"desk",label:"탁상형 달력",description:"앞·뒷면과 월별 콘텐츠를 함께 구성하는 양면 달력입니다.",icon:"🗓️",enabled:true,sortOrder:1,baseType:"desk"},
    {id:"wall",label:"벽걸이형 달력",description:"학교 이미지와 큰 월력을 중심으로 구성하는 단면 달력입니다.",icon:"📅",enabled:true,sortOrder:2,baseType:"wall"},
    {id:"poster",label:"연간 포스터형",description:"한 장에서 연간 학사일정을 확인하는 벽보형 달력입니다.",icon:"▦",enabled:true,sortOrder:3,baseType:"poster"},
    {id:"postcard",label:"엽서형 달력",description:"표지와 12개월 월력을 카드처럼 구성하는 단면 달력입니다.",icon:"✉️",enabled:true,sortOrder:4,baseType:"postcard"}
  ],
  templates:[
    {id:"tpl-2027-basic-desk",name:"학교 기본형",description:"학교 전경과 교표, 월별 학사일정을 균형 있게 보여주는 표준 탁상형 템플릿입니다.",type:"desk",status:"published",edition:2027,template:"school-basic",features:["학교 정보 강조","5×7·6×7"],pageSummary:"표지·월력 12장·뒷면",updatedAt:"2026-07-27T00:00:00.000Z",version:1},
    {id:"tpl-2027-minimal-desk",name:"사진 미니멀형",description:"월별 대표 사진과 월력을 간결하게 배치한 현대적인 탁상형 템플릿입니다.",type:"desk",status:"published",edition:2027,template:"minimal",features:["사진 중심","6×7"],pageSummary:"표지·월력 12장·뒷면",updatedAt:"2026-07-26T00:00:00.000Z",version:1},
    {id:"tpl-2027-wall",name:"학교 이미지형",description:"상단 학교 이미지와 넓은 월력을 사용하는 벽걸이형 기본 템플릿입니다.",type:"wall",status:"published",edition:2027,template:"school-basic",features:["큰 월력","전경 강조"],pageSummary:"표지·월력 12장",updatedAt:"2026-07-25T00:00:00.000Z",version:1},
    {id:"tpl-2027-poster",name:"연간 일정 포스터",description:"연간 학사일정을 한눈에 확인하도록 구성한 포스터형 템플릿입니다.",type:"poster",status:"published",edition:2027,template:"school-basic",features:["연간 보기","행사 중심"],pageSummary:"연간 월력 1장",updatedAt:"2026-07-24T00:00:00.000Z",version:1},
    {id:"tpl-2027-postcard",name:"월별 사진 엽서형",description:"표지와 12개월 월력을 한 장씩 구성하고 각 월의 사진과 월력을 편집하는 엽서형 템플릿입니다.",type:"postcard",status:"published",edition:2027,template:"minimal",features:["12개월 카드","사진 중심"],pageSummary:"표지·월력 12장·뒷표지",updatedAt:"2026-07-28T00:00:00.000Z",version:1},
    {id:"tpl-2026-basic",name:"학교 기본형",description:"이전 연도 운영 기록을 위해 보관된 2026 Edition입니다.",type:"desk",status:"archived",edition:2026,template:"school-basic",features:["보관본","학교 정보 강조"],pageSummary:"표지·월력 12장·뒷면",updatedAt:"2025-11-30T00:00:00.000Z",version:1}
  ]
};