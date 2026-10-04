# 교정본 네이티브 출력 경로 분석

2026-10-04. 기존 검사 화면 연결과 실제 네이티브 출력 연결은 다르다.

## 확인한 경로

에디터 template-publishing-runtime.ensurePrintPreflight는 rendererId=template-editor-review-dom.v1로 요청한다. 사용자 서비스 scripts/pdf-worker.mjs의 renderTemplatePreflightPages는 동일 ID를 요구하고 브라우저로 에디터 출력 페이지를 렌더링한다. 이 경로를 교정본 네이티브 출력으로 간주할 수 없다.

scripts/lib/native-cmyk-pdf-writer.mjs는 직접 PDF/X-4·DeviceCMYK 이미지·벡터·폰트 아웃라인을 작성하는 별도 모듈이다. 현재 production Worker에서 호출되지 않는다. resolved-print-contract-adapter.mjs의 semantic-object, contact-card, monthly-quote, composite-master 및 vector는 unsupported다. 임의 개체를 삭제하거나 기존 네이티브 샘플 레이아웃으로 교체해서 통과시키면 안 된다. 달력 어댑터의 기본 격자 생성만으로 최신 일정·음력·스타일 동등성을 보장할 수도 없다.

## 이번 연결

GET /api/production-print-readiness?requestId=...&revisionId=... 는 Master Admin 인증을 확인하고 해당 접수의 저장 버전만 검사한다. 문서 해시·버전·제작/재단 규격과 개체별 출력 준비 결과를 반환한다. 기존 네이티브 authoring/compiler를 읽기 전용 사본에서 사용한다. 진단 목적으로만 intent를 계산하며 저장본의 플래그·폰트·색·원본·승인을 만들거나 수정하지 않는다.

에디터 ‘출력 준비 확인’에서 전체 면/개체별 누락 원본, CMYK JPEG, 유효 DPI, 정확한 폰트, 인쇄 색, 복합 개체 지원 상태를 조회한다. 최종 생성 요청도 동일 보고서를 확인한다. 네이티브 Worker 연결 전에는 기존 DOM/PDF 변환 경로로 보내지 않는다. 새 SQL은 없다. 검사 결과는 인쇄 승인이나 Worker 실행 결과가 아니다.

## 실제 출력 연결을 완료하려면

1. 공통 Runtime 개체에서 손실 없이 Print Document 기본 구성요소를 생성한다. 학교 상징·연락처·인용문·복합 개체 및 최신 달력 표시를 포함하고 미지원은 명시적으로 차단한다.
2. RGB 사용자 원본은 별도 CMYK 파생 원본으로 생성하고 원본 해시·출력 ICC·변환 정보·배치 DPI를 연결한다. 원본은 유지한다. 정확한 폰트와 인쇄 색을 보관한다. 승인값을 자동 생성하지 않는다.
3. production revision ID + document hash + 검사 package SHA로 전용 native Worker Job을 고정하고 기존 DOM renderer 분기와 혼용하지 않는다.
4. native writer 결과의 PDF/X-4·Japan Color 2011 Coated·K100·Box·0.540pt 재단선·폰트·면수 검증을 같은 Job/버전에 저장한다.
5. 접수본→교정본→Print Document→PDF 전체 면의 개체·이미지·내용 동등성을 검증한 뒤 육안/실물 확인과 최종 전달로 진행한다.

현재 실제 CMYK 생성 성공 또는 인쇄 품질 검사 완료를 의미하지 않는다.

## 저장 버전의 원본·배치 검사

에디터 ‘원본·배치 검사’는 GET /api/production-print-images로 저장 버전의 Runtime 개체에서 사용 원본 목록을 구한다. 접수 ID와 버전 ID를 함께 조회하고 저장 문서의 SHA-256도 확인한다. 원본 하나씩 별도 요청해 25MiB 이내 실제 보관 바이트의 크기·헤더 형식·픽셀 크기·SHA-256을 확인한다. 관리자 교정 원본은 ready 기록 및 저장된 content_hash가 일치해야 한다. 접수 원본에는 기존에 SHA가 저장되지 않았으므로 이번 조회 바이트의 SHA를 기록한다. 다른 접수의 파일, pending 파일, 미사용 파일, 외부 URL로 대체하지 않는다.

해상도는 공통 native-print-authoring.effectiveImageDpi를 사용한다. 직접 이미지와 교표/학교 전경의 전체 프레임에 대해 실제 mm·fit·확대율로 계산한다. 한 원본의 여러 면 배치를 각각 검사한다. 교가/교목/교화 등의 복합 개체, 중첩 개체, 여러 이미지 참조가 있는 개체는 내부 배치가 확정되기 전까지 unresolved다. 미리보기의 전체 프레임을 이미지 영역으로 가정해 통과시키지 않는다.

결과 JSON은 접수·버전·문서 SHA·원본 SHA와 배치 결과를 포함하며 다운로드할 수 있다. 서버 검사 이력 저장이나 인쇄 승인 기록은 아니며 재진입 시 다시 검사한다. 픽셀 크기 검사는 헤더 기준이고 완전한 디코딩 검사는 아니다. RGB 원본의 CMYK 파생 이미지 생성과 native Worker 연결은 후속 구현이 필요하다. 새 SQL은 없다.
