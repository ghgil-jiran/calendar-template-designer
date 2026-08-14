# 대표 탁상형 템플릿 기준 선택

- 상태: v1.1 28면·Master 계약을 숨은 Runtime 입력으로 연결 완료, 시각 Parity 전
- Template Package: `desk-academic-standard@1.0.0`
- 달력 템플릿 에디터 출발점: `desk-sample-2`
- 사용자 서비스 비교 기준: `ghgil-jiran/-v1.1`의 `integration/runtime-v2`

## 결론

대표 탁상형의 출발점은 `desk-sample-2` 이미지 콜라주형으로 정한다.

이 선택은 현재 샘플을 그대로 사용자 서비스에 적용한다는 뜻이 아니다. 두 후보 중 사용자 서비스 v1.1의 월별 사진 구조에 더 가까운 쪽을 선택한 것이다. 사용자 서비스의 페이지 순서, 사진+메모, 마지막 연락처 면은 별도로 이식하고 비교해야 한다.

## 비교 결과

| 비교 항목 | 사용자 서비스 v1.1 | `desk-sample-2` | `desk-sample-6` |
|---|---|---|---|
| 전체 구성 | 14장 28면 | 14장 28면 구성 가능 | 14장 28면 구성 가능 |
| 월력 | 앞면에 3월~익년 2월 전체 월력 | 공통 월력 Master 사용 | 공통 월력 Master 사용 |
| 월력 행 | 5행 고정, 30·31일 병기 | 5·6행 지원 | 5·6행 지원 |
| 월별 뒷면 | 다음 달 사진+메모 | 이미지 콜라주+띠력 | 월별 플래너 |
| 학교 상징 | 별도 앞면 | 학교 상징 개체 보유 | 학교 상징 개체 보유 |
| 마지막 면 | 2월 월력+연락처 | 별도 이식 필요 | 별도 이식 필요 |
| 통합 거리 | 기준 | 사진 구조가 가까움 | 콘텐츠 용도가 다름 |

## 사용자 서비스 v1.1 페이지 순서

1. 1장: 표지 / 연간 달력
2. 2장: 학교 상징 / 3월 사진+메모
3. 3~13장: 3월~익년 1월 월력 / 다음 달 사진+메모
4. 14장: 익년 2월 월력 / 연락처 끝지

이 순서를 `template.json`의 `pageSequence`에 기록한다. 월은 숫자 하나로 고정하지 않고 학사연도 시작월을 기준으로 한 `monthOffset`으로 표현한다.

## 확정 근거

- 사용자 서비스 `src/lib/calendar/sample-doc.ts`: 14장 28면과 월력·사진 짝 구성
- 사용자 서비스 `src/features/editor/editor-pages.ts`: 사진 위/다음 달 월력 아래의 물리적 짝 규칙
- 사용자 서비스 `src/lib/calendar/constants.ts`: 3월 시작, 12개월, 5행×7열
- 달력 템플릿 에디터 `applyDeskRepresentativePreset`: `desk-sample-2`의 월별 이미지 콜라주 구조

## v1.1 사진·메모와 끝지 추출 결과

월별 사진+메모 면은 좌표가 고정된 개체 모음이 아니다. 사용자 서비스의 `MonthPhotoBackCanvas`는 안전영역 안에서 사진과 메모를 `1.7:1` 비율로 배치한다. 사진 빈 슬롯 안내는 화면 전용이고, 메모는 7칸 중 앞 6개에만 DOM 구분선을 그린다. PDF에서 gradient 괘선 굵기가 불균일했던 사고를 막는 규칙이므로 Template Package에 복합 Master와 출력 규칙으로 기록했다.

끝지는 실제 자유 배치 부품의 측정값을 사용한다.

| 부품 | x | y | width | height | 데이터 |
|---|---:|---:|---:|---:|---|
| 교표·학교명 | 6 | 30 | 32 | 10 | `school.name` |
| 끝지 사진 | 48.0 | 13.5 | 47.1 | 55.1 | 끝지 전용 사진, 없으면 학교 전경 |
| 연락처 카드 | 4.9 | 74.2 | 90.2 | 18.8 | 주소·교무실·행정실·FAX·홈페이지 |

연락처는 값이 있는 칸만 표시하고 전부 비어 있으면 카드 자체를 숨긴다. 템플릿 에디터의 `school.contacts[]`는 저장 구조를 바꾸지 않고 Dataset Adapter에서 사용자 서비스의 `school.contact.{address,telAcademic,telAdmin,fax,site}` 계약으로 투영한다.

월별 이미지의 목표 Binding은 실행 불가능한 `monthlyImages[currentMonth]` 문자열 대신 `monthlyImages.{YYYY-MM}` 패턴으로 명시했다. Runtime 페이지 Adapter는 기존 `calendar.monthlyImages.current`와 새 패턴을 모두 페이지 연월의 실제 경로(예: `monthlyImages.2027-03`)로 바꾼다. 기존 프로젝트 데이터와 원본 개체는 수정하지 않는다.

## 28면 숨은 비교 결과

`integration-parity-bridge.js`가 사용자 서비스 v1.1의 28면 정본을 독립적으로 생성하고 현재 프로젝트 페이지와 역할·연월을 순서대로 비교한다. 결과는 `ACDLRuntimeBridge.lastParityReport`에만 보관하며 기존 화면과 Runtime 정상/경고 표시는 바꾸지 않는다.

현재 달력 템플릿 에디터와 v1.1은 둘 다 14장 28면이지만 물리적 짝이 다르다.

- 현재 템플릿 에디터: 표지 장 → `3월 월력/3월 뒷면`부터 월별 12장 → 뒷표지 장
- 사용자 서비스 v1.1: 표지/연간 → 학교 상징/3월 사진 → `3월 월력/4월 사진`부터 진행 → 2월 월력/연락처

따라서 현재 페이지 배열을 그대로 두고 역할 이름만 바꾸지 않는다. `desk-academic-page-adapter.js`가 원본을 수정하지 않고 학교 상징과 연락처 끝지 위치, 사진 면의 연월 오프셋을 함께 반영해 v1.1 순서의 새 참조 페이지 28면을 만든다.

숨은 비교 보고서는 다음도 별도로 기록한다.

- 28면 개수·역할·연월 불일치
- 12개월 사진 중 비어 있는 월
- 끝지 연락처 전체가 비어 있는 상태

## Template Package Runtime 연결

`template-package-loader.js`는 manifest가 가리키는 template, bindings, print 파일을 함께 읽고 ID·버전 일치를 확인한다. 로드 결과는 기존 카탈로그나 편집 상태에 섞지 않는다.

`desk-academic-package-runtime.js`는 페이지 구성 Adapter 결과에 Package Master를 적용해 별도 28면 문서를 만든다. 이 문서는 `ACDLRuntimeBridge.lastDeskAcademicPackageDocument`에서만 확인하며 현재 캔버스를 교체하지 않는다.

- 모든 월력 면은 Package 기본값인 5행을 사용한다.
- 사진+메모 면은 `monthlyImages.YYYY-MM`으로 해석된 사진, 7칸/6선 메모, 교훈·홈페이지 푸터 계약을 가진다.
- 끝지는 학교명·전용 사진/학교 전경 폴백·연락처 5필드 계약을 가진다.
- 28면, 빈 Master, 5행 위반은 오류로 진단한다.
- 비어 있는 월별 사진과 연락처는 현재 테스트 입력 단계에서 정보 진단으로 남긴다.

Package 상태는 `runtime-contract-wired`로 올렸지만 `publishable`은 계속 `false`다. 현재 Runtime Renderer가 복합 사진+메모 Master와 연락처 카드를 실제 v1.1 화면처럼 그린 뒤 시각 비교를 통과해야 배포 가능 상태를 검토한다.

## 아직 하지 않는 일

- 기존 사용자 서비스 UI 변경
- `desk-sample-2`의 현재 화면 자동 교체
- 사진+메모 복합 Master를 기존 화면에 자동 적용
- 기존 프로젝트 저장 JSON 자동 migration
- 인쇄 출력기 교체

## 다음 검증

현재 소스에서 표지·연간·학교 상징·월력·이미지 콜라주의 frame과 binding을 `template.json`에 추출했다. 이미지 Binding은 현재 소스 경로와 목표 Dataset 경로가 다르므로 둘을 함께 기록하고 자동 치환하지 않았다.

1. Runtime Renderer에 사진+메모 복합 Master와 연락처 카드의 숨은 렌더러를 추가한다.
2. 같은 Dataset으로 기존 사용자 서비스와 새 28면 문서를 시각 비교한다.
3. 5행 병기 셀, 텍스트, 일정, 이미지 결과가 일치한 뒤 `publishable` 상태를 검토한다.
