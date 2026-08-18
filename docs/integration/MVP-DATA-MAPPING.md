# 사용자 MVP 데이터 매핑

상태: 사용자 서비스 v1.1 Adapter 계약 확인 완료
기준 계약: Dataset Contract `1.0`, Template Package Binding Contract `1.1`  
목적: 기존 사용자 MVP의 입력 데이터를 Designer Studio 템플릿과 Template Runtime에 손실 없이 전달한다.

## 이 문서의 사용 원칙

- 이 문서는 사용자 MVP를 새로 설계하는 문서가 아니다. 기존 MVP의 UI, 일정 인식, PDF, 금액 산정 흐름을 보존하며 Runtime 입력으로 변환하는 기준이다.
- `MVP 원본 필드`는 사용자 MVP 저장소와 실제 저장 JSON을 확인한 뒤 확정한다. 아직 확인하지 않은 필드명은 추측해 고정하지 않는다.
- 템플릿은 사용자 데이터의 저장소가 아니다. 템플릿에는 `school.name` 같은 Binding 경로만 두고 실제 값은 Dataset에 둔다.
- 사용자 원본 데이터는 유지한다. 템플릿을 바꾸거나 다시 렌더링해도 원본 학교 정보와 일정은 덮어쓰지 않는다.

## 데이터 흐름

```text
사용자 MVP 원본 데이터
        ↓
MvpDatasetAdapter
        ↓
Runtime Dataset 1.0
        ↓
Template Runtime + 배포 템플릿
        ↓
ResolvedDocument
        ↓
화면 미리보기 / 인쇄용 PDF
```

`MvpDatasetAdapter`는 통합 과정에서 둘 데이터 구조의 차이를 흡수하는 변환 계층의 작업명이다. 사용자 MVP 화면이나 Designer Studio 내부 모델이 Runtime 구조에 직접 종속되지 않게 한다.

## 1차 통합에 사용할 Dataset 형태

아래는 현재 에디터의 Binding Contract와 실제 렌더링 코드에서 확인한 목표 구조다. Schema의 세부 필드는 아직 엄격하게 고정되어 있지 않으므로, 1차 통합 검증 후 JSON Schema와 TypeScript 타입을 함께 강화한다.

```json
{
  "schemaVersion": "1.0",
  "locale": "ko-KR",
  "timezone": "Asia/Seoul",
  "school": {
    "name": "샘플 학교",
    "englishName": "SAMPLE SCHOOL",
    "slogan": "배움으로 성장하는 학교",
    "address": "",
    "website": "",
    "contacts": [],
    "profile": {
      "logo": { "assetId": "asset.logo" },
      "building": { "assetId": "asset.building" },
      "flower": { "assetId": "asset.flower", "description": "" },
      "tree": { "assetId": "asset.tree", "description": "" },
      "motto": { "description": "" },
      "song": { "assetId": "asset.song", "description": "" }
    }
  },
  "calendar": {
    "year": 2027,
    "startMonth": 3,
    "weekStart": "sunday",
    "gridRows": 6,
    "events": [],
    "dataOptions": {
      "includeHolidays": true,
      "includeSolarTerms": false,
      "includeLunar": false
    }
  },
  "monthlyImages": {},
  "monthlyTexts": {},
  "monthlyQuotes": {},
  "assets": [],
  "variables": {}
}
```

`monthlyTexts`, `monthlyQuotes`와 최상위 `assets`는 현재 Runtime 타입의 `additionalProperties`로 전달할 수 있지만 공식 세부 계약에는 아직 없다. 첫 통합에서 실제 사용이 확인되면 Schema와 타입에 명시한다.

## 학교 정보 매핑

사용자 서비스의 실제 원본은 `calendar_docs.doc`와 `doc_render_state.stores`다. 아래 필드는 `integration/runtime-v2`의 Adapter와 테스트에서 확인했으며, 템플릿 에디터는 원본 버킷을 직접 읽지 않고 Adapter가 만든 Dataset만 받는다.

| 업무 데이터 | MVP 원본 필드 | Runtime Dataset 경로 | 현재 에디터에서 확인된 위치 | 1차 처리 |
|---|---|---|---|---|
| 학교명 | `doc.meta.schoolName`, 보조 `school-crest-v1.crest.nameKo` | `school.name` | `book.school.name` | 필수 |
| 영문 학교명 | `school-crest-v1.crest.nameEn` | `school.englishName` | `book.school.englishName` | 선택 |
| 슬로건 | 원본 확인 필요 | `school.slogan` | `book.school.slogan` | 선택 |
| 주소 | `school-contact-v1.contact.address` | `school.address` | `book.school.address` | 선택 |
| 홈페이지 | `school-contact-v1.contact.site` | `school.website` | `book.school.website` | 선택 |
| 대표·부서 연락처 | `school-contact-v1.contact.telAcademic/telAdmin/fax` | `school.contacts[]` (`academic`/`admin`/`fax`) | 프로필 입력에는 `contacts[]`, 초기 프로젝트에는 `phone`이 존재 | Adapter 구조 확인 |
| 교표 | `school-crest-v1.crest.imageRef` | `school.profile.logo` | `book.school.profile.logo` | `MvpAssetRef` |
| 학교 전경 | 원본 확인 필요 | `school.profile.building` | `book.school.profile.building` | 필수 이미지 |
| 교화 | `school-symbols-v1.symbols.flower/flowerDesc` | `school.profile.flower` | `book.school.profile.flower` | 선택 |
| 교목 | `school-symbols-v1.symbols.tree/treeDesc` | `school.profile.tree` | `book.school.profile.tree` | 선택 |
| 교훈 | 현재 Adapter는 `school-symbols-v1.symbols.bird`를 설명으로 투영 | `school.profile.motto` | 프로필 입력의 `motto`, Binding Contract의 `profile.motto` | 의미 재확인 필요 |
| 교가 | 원본 확인 필요 | `school.profile.song` | 프로필 입력은 이미지·설명 모두 지원 | 선택 |
| 사용자 등록 학교 이미지 | 원본 확인 필요 | `school.profile.customAssets[]` 또는 `assets[]` | `book.school.customAssets`, `template.resources.sampleAssets`가 함께 존재 | 소유권 분리 필요 |

학교 정보의 텍스트와 이미지에는 값 자체 대신 필요한 경우 `assetId`, 원본 파일명, MIME 유형, 픽셀 크기, 체크섬을 함께 전달한다. Base64 이미지를 Dataset과 템플릿에 중복 저장하지 않는다.

## 달력 설정 매핑

| 업무 데이터 | MVP 원본 필드 | Runtime Dataset 경로 | 현재 에디터 기준 | 1차 처리 |
|---|---|---|---|---|
| 기준 연도 | `doc.meta.academicYear` | `calendar.year` | `settings.year` | 필수 |
| 시작월 | v1.1 고정값 `3` | `calendar.startMonth` | `settings.startMonth` | 대표 탁상형 고정 |
| 주 시작 요일 | v1.1 고정값 `sunday` | `calendar.weekStart` | `settings.weekStart` | 대표 탁상형 고정 |
| 월력 행 수 | v1.1 고정값 `5` | `calendar.gridRows` | `settings.calendarRows` | 대표 탁상형 고정 |
| 공휴일 포함 | v1.1 고정값 `true` | `calendar.dataOptions.includeHolidays` | Binding Contract에 정의 | 기존 코드 판정 보존 |
| 24절기 포함 | `doc.spreads[].pages[].elements[].showSolarTerms` | `calendar.dataOptions.includeSolarTerms` | Binding Contract에 정의 | 하나라도 true면 포함 |
| 음력 포함 | `doc.spreads[].pages[].elements[].showLunar` | `calendar.dataOptions.includeLunar` | Binding Contract에 정의 | 하나라도 true면 포함 |
| 달력 유형·크기 | 원본 확인 필요 | Template 선택 정보로 전달 | `productType`, `settings.sizePreset` | Dataset이 아닌 프로젝트/템플릿 선택 값 |
| 앞·뒤 간지 수 | 원본 확인 필요 | 프로젝트 생성 옵션 | `settings.frontInsertCount`, `settings.rearInsertCount` | 템플릿 허용 범위와 검증 |

달력 유형, 페이지 크기, 양면 여부, 페이지 구성은 사용자 콘텐츠가 아니라 선택한 배포 템플릿의 구조다. 사용자 MVP가 같은 값을 갖고 있더라도 Runtime 실행 시 템플릿과 불일치하면 오류로 처리한다.

## 학사일정 매핑

실제 일정 원본은 `user-schedules-v1.schedules[월].events[]/periods[]`이며 3~12월은 학사연도, 1~2월은 다음 연도로 변환한다. 단일 일정은 `d`, 기간 일정은 `s/e`를 사용하고 `label`, 선택적 `id/color`를 읽는다. 유효하지 않은 월·일·기간은 Dataset에서 제외하고 Adapter 오류로 반환한다.

현재 에디터가 실제로 사용하는 일정 형태는 다음과 같다.

```json
{
  "id": "event-001",
  "title": "여름방학",
  "startDate": "2027-07-20",
  "endDate": "2027-08-15",
  "category": "vacation",
  "source": "user-import",
  "priority": 90,
  "range": true,
  "grades": [],
  "memo": ""
}
```

| MVP 의미 | MVP 원본 필드 | Runtime 이벤트 필드 | 변환 규칙 |
|---|---|---|---|
| 일정 식별자 | 원본 확인 필요 | `id` | 원본 ID가 없으면 가져오기 단위에서 안정적인 ID 생성 |
| 일정명 | 원본 확인 필요 | `title` | 공백 제거 후 빈 값은 오류 |
| 시작일 | 원본 확인 필요 | `startDate` | `YYYY-MM-DD`, Asia/Seoul의 날짜로 정규화 |
| 종료일 | 원본 확인 필요 | `endDate` | 없으면 `startDate`와 같게 저장 |
| 구간 일정 여부 | 원본 확인 필요 | `range` | `endDate !== startDate`로 계산 가능하므로 원본과 불일치 시 재계산 |
| 분류 | 원본 확인 필요 | `category` | `holiday`, `school`, `education`, `student`, `safety`, `vacation` 기본 분류로 매핑 |
| 우선순위 | 원본 확인 필요 | `priority` | MVP 값이 없으면 분류 기본값 사용 |
| 대상 학년 | 원본 확인 필요 | `grades[]` | 값이 있을 때만 유지 |
| 메모 | 원본 확인 필요 | `memo` | 출력 Binding이 없더라도 원본 보존 |
| 출처 | 원본 확인 필요 | `source` | 사용자 입력, 파일 인식, 공휴일 연동 등을 구분 |

일정 파일의 원본과 인식 결과를 구분한다. 워드·엑셀 원본 파일은 Asset/Import 기록으로 보존하고, Runtime에는 검토가 끝난 정규화 이벤트만 전달한다.

## 월별 콘텐츠 매핑

| 업무 데이터 | MVP 원본 필드 | Runtime Dataset 경로 | 키 규칙 | 1차 처리 |
|---|---|---|---|---|
| 월별 대표 이미지 | `photo-assets-v1.pageSrc[pageN]` + `doc.spreads[].month` | `monthlyImages[YYYY-MM]` | 시작월부터 12개월의 실제 연·월 | 연결 월 없는 쪽은 경고·제외 |
| 월별 이미지 파일 참조 | `{ref:'idb',id}` 또는 `{ref:'url',src}` | `monthlyImages[key].assetRef` | 사용자 서비스 `MvpAssetRef` | 읽기 전용 Resolver 연결 |
| 월별 추가 문구 | 원본 확인 필요 | `monthlyTexts[YYYY-MM]` | 이미지와 같은 키 | Schema 보완 후 사용 |
| 월력용 명언 문구 | MVP 보유 여부 확인 필요 | `monthlyQuotes[YYYY-MM]` | 제목·한글·영문·출처·출처 상태 | Template Editor에서 `monthlyQuote` 개체 구현 |
| 월별 자유 개체 편집 | 기존 MVP 구조 확인 필요 | 프로젝트 override 또는 별도 사용자 편집 계약 | 페이지 ID와 연·월을 함께 보존 | 1차 범위에서는 최소화 |

숫자 월(`3`)만 키로 사용하면 12개월이 연도를 넘을 때 충돌하므로 항상 `YYYY-MM`을 사용한다.

### AssetRef 해석 규칙

사용자 서비스 v1.1의 실제 구현을 기준으로 다음 순서를 유지한다.

1. `{ref:'url',src}`는 `src`를 그대로 사용한다.
2. `{ref:'idb',id}`는 IndexedDB `calendar-uploads`의 `assets` store에서 ID로 조회한다.
3. 로컬 자산의 `UploadAsset.dataUrl`이 있으면 이를 사용한다.
4. 로컬에 없으면 Supabase 공개 버킷 `print-assets/user/{id}`의 존재를 확인하고 공개 URL을 사용한다.
5. 두 위치 모두 없으면 원본 참조는 보존하고 `ASSET_NOT_FOUND` 경고와 빈 슬롯을 반환한다.

템플릿 에디터는 사용자 서비스 IndexedDB나 Supabase 클라이언트를 직접 소유하지 않는다. 사용자 서비스가 `getAsset`, `cloudAssetUrl`, `cloudAssetExists` 구현을 주입하며, Resolver는 Shadow Runtime용 복제 Dataset에만 렌더 가능한 `src`를 추가한다.

현재 대표 Template Package는 연락처를 `school.contact.address/telAcademic/telAdmin/fax/site`로 읽는다. 사용자 서비스의 공식 출력인 `school.contacts[]`는 그대로 보존하고, Shadow Runtime 진입 시에만 위 5개 필드의 읽기 전용 호환 보기를 만든다. 이 투영은 사용자 서비스 저장 Schema 변경이 아니다.

## Shadow 진단 JSON 경계

사용자 서비스가 Shadow 세션 결과를 개발 검토 화면이나 파일로 전달할 때는 전체 세션을 직렬화하지 않고 `user-service-shadow-diagnostic.v1` 보고서만 사용한다. 모듈 진입점은 `@calendar-publishing/designer-runtime-integration`의 `createUserServiceShadowDiagnosticReport`와 `serializeUserServiceShadowDiagnosticReport`다.

보고서에는 문서·템플릿 식별자, Dataset Schema 버전, 실행 상태, 페이지·일정·연락처·월별 이미지 건수와 허용된 진단 필드만 포함한다. `expected`/`actual`은 숫자·불리언만 허용한다. 학교 원본 Dataset, 생성 HTML, 이미지 본문, 저장소 자산, 문자열·객체 비교값, stack과 임의 확장 필드는 제외한다. 이 JSON은 비교 증거이며 사용자 서비스의 저장 Schema나 운영 PDF 입력이 아니다.

## Template Package 공급 방식

사용자 서비스는 `@calendar-publishing/designer-runtime-integration`의 공통 API를 사용한다. Template Package는 배포 URL에서 `loadTemplatePackage(fetcher, base)`로 불러오거나, 빌드 시 JSON을 직접 import한 뒤 `assembleTemplatePackage(files)`로 조립할 수 있다. 두 방식 모두 manifest의 필수 파일과 manifest/template의 ID·버전을 같은 규칙으로 검사한다.

검증된 Package의 `template`과 사용자 서비스 Adapter 결과는 `buildDeskAcademicPackageDocument`에 전달한다. 이 함수는 기존 사용자 문서를 저장하거나 변경하지 않고 화면·비교용 공통 문서를 반환한다. 사용자 서비스에 어떤 방식으로 패키지 소스를 고정할지는 실제 작업 브랜치에서 정하되, 운영 중 임의 최신 버전을 자동 선택하지 않고 ID와 버전을 명시적으로 고정한다.

## 템플릿·프로젝트·주문 데이터 경계

| 데이터 | 소유 시스템 | Runtime Dataset 포함 여부 |
|---|---|---|
| 템플릿 ID·버전·페이지·Binding | Designer Studio/템플릿 저장소 | 별도 Template 입력 |
| 학교 정보·학사일정·월별 콘텐츠 | 사용자 MVP | 포함 |
| 사용자 편집 프로젝트 ID·저장 버전 | 사용자 MVP | Runtime 외곽 실행 정보 |
| 상품 ID·수량·용지·후가공·금액 | 사용자 MVP/우리학교인쇄 | 포함하지 않음 |
| 주문 ID·결제·배송·제작 상태 | 우리학교인쇄 | 포함하지 않음 |
| 최종 PDF 메타데이터 | Publishing 결과 | Runtime 결과 이후 별도 계약 |

## 현재 코드에서 확인된 불일치와 보완 항목

1. `schemas/runtime/dataset-contract.schema.json`은 `school`, `calendar` 내부 필드를 아직 검증하지 않는다.
2. `RuntimeDataset` 타입은 상위 객체를 `Record<string, unknown>`으로만 선언한다.
3. `LegacyProjectAdapter.toDataset()`은 학교와 일정은 전달하지만 월별 이미지와 Asset 참조를 전달하지 않는다.
4. 에디터의 일부 Dataset 구성은 일정을 `schedule`로 저장하지만 Runtime Adapter는 `calendar.events`를 사용한다.
5. 월력 행 수가 에디터에서는 `calendarRows`, 목표 Dataset에서는 `gridRows`로 표현된다.
6. 학교 연락처, 교훈, 교가, 사용자 등록 이미지의 내부 구조가 생성 경로에 따라 다르다.
7. `monthlyTexts`, `monthlyQuotes`와 사용자 페이지별 override의 공식 계약이 아직 없다.

이 항목은 통합 전에 문서만으로 임의 확정하지 않는다. 사용자 MVP 소스 분석 후 Adapter 테스트와 함께 하나씩 닫는다.

## 사용자 MVP 확보 후 채울 확인표

- [ ] 사용자 프로젝트 저장 JSON 또는 API 응답 예시
- [ ] 학교 정보 입력·저장 코드와 이미지 업로드 결과
- [ ] 일정 직접 입력 및 워드·엑셀 인식 결과 구조
- [ ] 공휴일·24절기·음력 데이터의 출처와 필드
- [ ] 월별 이미지·텍스트 저장 구조
- [ ] 기존 미리보기와 PDF 생성 입력
- [ ] 금액 산정에 사용하는 상품·페이지·수량 필드
- [ ] 최종 파일을 우리학교인쇄에 전달하는 현재 경계
- [ ] 기존 프로젝트 재열기·버전 저장 방식

## 1차 매핑 완료 기준

- 모든 필수 MVP 필드가 Dataset 경로 하나에만 매핑된다.
- 변환되지 않은 원본 필드와 의도적으로 제외한 필드가 구분된다.
- 단일 일정과 연도를 넘는 구간 일정이 손실 없이 변환된다.
- 12개월 월별 이미지가 `YYYY-MM` 키로 정확히 연결된다.
- 템플릿을 바꿔도 사용자 원본 데이터가 유지된다.
- 같은 Dataset으로 화면 미리보기와 PDF를 생성한다.
- Dataset Schema 검증 실패와 Binding 누락을 사용자에게 확인 가능한 오류로 반환한다.
