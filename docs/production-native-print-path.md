# 제작 교정본 인쇄 경로: 기존 PDF Worker 재사용 조사와 별도 경로 롤백

2026-10-04. ImageMagick 이미지 준비 경로는 폐기한다. 이 문서는 이전 실행 안내를 대체한다. 기존 템플릿 인쇄 검사 경로를 조사한 결과이며, 교정본의 실제 최종 PDF 연결 완료를 의미하지 않는다.

## 기존 검사 경로에서 확인한 내용

- 에디터 `template-library-runtime.js`의 `runFinalPreflight` → `ACDLTemplatePublishing.ensurePrintPreflight` → 에디터 프록시 → 사용자 서비스 `src/app/api/template-print-preflight/route.ts`.
- 사용자 서비스는 템플릿 ID·Package 버전·SHA·보관 경로 및 rendererId/editorPrintOrigin을 검증하고 `template_print_preflight_jobs`에 작업을 저장한다. 현재 계약은 템플릿 Package이며 제작 접수/교정 버전 계약은 없다.
- 사용자 서비스 `scripts/pdf-worker.mjs`의 `processTemplatePreflightJob` → `renderTemplatePreflightPages`가 에디터 `?templatePrintJob=...&templatePrintSha=...&page=...`를 연다.
- 에디터 `features/preview-pdf-review-export.js`는 `/api/templates?printRenderJob=...&sha256=...`로 동결 Package 프로젝트를 읽고 기존 프로젝트 로더와 `renderPage`를 사용한다. 이미지와 폰트 로드를 기다리고 실제 면별 출력 크기·총 면수·렌더러·해시를 Worker에 전달한다.
- Worker가 면별 브라우저 PDF를 만들고 기존 `convertToCmyk`로 서체 아웃라인·CMYK·K100·PDF/X-4를 처리한다. `inspectTemplatePdf`로 검사한 결과와 최종 파일을 보관한다. Ghostscript·Inkscape·qpdf를 사용하며 이 경로에 ImageMagick 호출은 없다.
- 기존 경로에는 브라우저 PDF 중간 산출물이 있다. 이를 처음부터 직접 네이티브 CMYK PDF를 작성하는 경로로 설명해서는 안 된다. 과거 성공한 방식의 재사용과 교정본 출력 성공은 구분한다.

## 재사용 방법과 필요한 연결

색 변환·K100·서체·최종 PDF 검사 도구는 기존 것을 재사용할 수 있다. 수정 대상은 입력 계약과 버전별 산출물 관리다.

1. 접수 ID·교정 버전 ID·documentHash·contentHash로 저장본을 고정한다. 템플릿 Package의 최신판이나 현재 편집 중 프로젝트로 대체하지 않는다.
2. 기존 인쇄 입력 조회에 교정본 분기를 추가한다. 저장된 `document.editorProject`를 사용하고 `production-asset://` 원본을 해당 접수의 사용자/ready 교정 원본으로만 해석한다. 보관 원본 해시와 실제 바이트 검증, 제한된 Worker 접근 및 이미지 로드 실패 시 중단이 필요하다. 현재 템플릿 렌더 입력 API는 접수 원본 공개를 위한 인증 계약이 아니므로 단순 재사용해서 공개하면 안 된다.
3. 기존 `renderPage`와 인쇄 페이지 구성·폰트/이미지 대기·제작/재단/도련 처리를 사용한다. 교정 모드의 월별 달력과 frozen Runtime 표시 처리도 같은 공통 경로에서 적용해야 한다. 독립 렌더러나 페이지별 임시 보정은 만들지 않는다.
4. 기존 PDF Worker에 교정 입력 분기를 연결하고 현재 `convertToCmyk` 및 최종 검사를 그대로 호출한다. 새 도구 설치나 이미지별 CMYK 사전 변환은 기본 조건이 아니다.
5. 작업·PDF·검사·승인은 접수와 특정 교정 버전의 동일 해시에 연결한다. 템플릿 게시 버전이나 이전 교정본의 승인 결과를 재사용하지 않는다. 사용자 서비스의 기존 템플릿 검사 이력 조회도 별도 교정 버전 식별이 필요하다.
6. 교정 v5 전체 30면과 원본 47개/배치 61곳으로 실제 시험한다. 이미지 교체·문구·위치·달력 데이터 보존을 화면과 출력에서 비교하고 PDF/X-4, Japan Color 2011 Coated, K100, 서체, 벡터 구조, TrimBox/BleedBox, 재단선 0.540pt를 검증한다.

이번 변경에서는 조사를 완료하고 별도 경로만 롤백했다. 교정본 입력 계약 및 기존 Worker 연결은 아직 구현하지 않았다. 교정본 검사 화면은 연결 전임을 표시하며 Job/PDF/승인을 만들지 않는다. 템플릿 자체의 기존 인쇄 검사 경로는 변경하지 않았다.

## 보존한 기능

접수 snapshot·사용자 원본, 관리자 ready 업로드, 에디터 교정본 불러오기/수정/새 버전 저장, 공통 렌더 미리보기, 버전 복원, 원본·배치 해상도 검사와 검사 기록 JSON 다운로드를 보존한다. 복합 이미지 영역은 기존 `renderPage`의 실제 이미지 영역을 측정한다. 헤더/픽셀/SHA 검사는 완전한 디코딩이나 인쇄 승인이 아니다. jsonb 문서 해시 호환과 sorted-json.v1 검증도 보존한다.

## 제거한 별도 경로

ImageMagick CMYK 준비 CLI·모듈·원본 직접 수집 Worker, 이미지 준비 Job API·검증 모듈·진행 조회, CMYK 준비 요청 버튼·원본 묶음 ZIP 다운로드, 교정본의 별도 네이티브 출력 준비 진단 API·화면을 제거했다. 기존 공통 native-print authoring/compiler 자체는 이전부터 있던 코드이므로 제거하지 않았다.

## DB 및 사용자 PC 후속

이미 적용한 `202610040002_calendar_production_image_jobs.sql`은 이력으로 보존한다. 기존 테이블과 Job/검사 기록은 삭제하거나 다른 상태로 위장하지 않는다. 새 `202610040003_retire_production_image_worker.sql`은 세 이미지 Job RPC의 실행 권한만 회수한다. 기존 SQL은 재실행하지 않는다. 직접 SQL 실행 도구가 없으므로 이 신규 SQL의 실제 적용은 별도로 확인해야 한다.

Preview 배포만으로 사용자 PC에 내려받은 옛 Worker 파일이 없어지지는 않는다. 이전 `run-image-worker-local.mjs` 및 ImageMagick Worker 명령은 실행하지 않는다. PC 파일 삭제·프로그램 제거·Defender 설정 변경은 수행하지 않았다. 보안 탐지 원인이나 오탐 여부도 확정하지 않는다.
