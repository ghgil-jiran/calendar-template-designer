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

### jsonb 문서 해시 호환

이전 버전은 JSON.stringify의 속성 순서로 document_hash를 계산했으므로 jsonb 저장 후 재조회할 때 같은 내용도 해시가 달라질 수 있었다. 신규 저장은 productionIntegrity.hashScheme=sorted-json.v1을 기록하고 모든 중첩 객체 키를 정렬해 SHA-256을 계산한다. 배열 순서는 유지하며 재조회한 문서의 정렬 해시를 저장 해시와 검증한다.

이전 버전은 기존 document_hash를 버전 식별자로 보존한다. 원래 직렬화 순서는 복원할 수 없으므로 기존 저장 해시를 재검증했다고 표시하지 않는다(integrity.storedHashVerified=false). 현재 조회한 문서의 contentHash를 별도로 계산해 계획 조회와 각 원본 검사 사이의 동일 내용 여부를 검증한다. 기존 접수·교정본을 갱신하거나 새 버전 저장을 요구하지 않는다. 내용 불일치에는 409와 구체적인 안내를 반환한다.

## 복합 이미지 영역과 CMYK 작업 입력

원본·배치 검사 시 교가·교목·교화가 있는 면은 저장된 editorProject 사본을 기존 renderPage로 표시한다. print-image-layout.js는 기존 semantic-media의 실제 영역을 측정하며 별도 렌더러나 면별 크기 보정값을 만들지 않는다. 저장 원본과 표시 이미지 참조가 같은지 확인하고, 회전·이미지 CSS 변환·원본 누락은 측정에서 제외한다. 측정 후 기존 프로젝트와 선택 상태를 복원한다.

POST /api/production-print-images는 동일 contentHash에서 전달한 내부 영역만 사용한다. 지원 역할·면·개체·원본·중복·양수 크기·부모 영역 안의 배치를 검사한다. layoutVerification=admin-renderer-measurement이며 서버에서 렌더링한 증거나 인쇄 승인이 아니다. 검사 결과에는 parentFrameMm과 실제 image frameMm을 함께 기록한다. 접수본·교정본을 수정하지 않는다.

검사 결과의 ‘CMYK 작업 원본 묶음 다운로드’는 inspection.json, 동결 document.json, originals/원본ID를 ZIP으로 내려받는다. 각 원본 바이트 SHA와 크기를 검사 기록과 대조하며 서명 URL은 넣지 않는다. 브라우저 묶음은 총 96MiB까지 지원한다.

tools/prepare-production-cmyk-images.mjs는 Worker용 이미지 준비 진입점이다. 묶음을 풀고 실행한다:

```sh
node tools/prepare-production-cmyk-images.mjs --inspection /path/input/inspection.json --document /path/input/document.json --source-dir /path/input/originals --output-dir /path/derived-new --icc /path/JapanColor2011Coated.icc --icc-sha256 ACTUAL_VERIFIED_PROFILE_SHA256 --srgb-icc /path/sRGB.icc
```

ImageMagick(LittleCMS 지원)이 필요하다. Windows는 ImageMagick 7의 magick 명령을 기본 사용하며 --magick 옵션으로 실행 파일 경로를 지정할 수 있다. Linux의 기본 경로는 identify/convert다. 출력 ICC는 CMYK 헤더·설명(Japan Color 2011 Coated)·지정 SHA를 확인한다. 공식 프로파일 파일 자체는 배포하지 않는다. embedded ICC가 없는 원본은 명시한 sRGB ICC를 입력 조건으로 쓰며 그 기준을 기록한다. 파일명만 바꾸거나 임의 CMYK 프로파일로 대체하지 않는다. 원본 폴더와 별도의 새 출력 폴더만 허용한다. sourceHash·revisionId·documentHash·contentHash를 유지하고 픽셀 크기 변경·업스케일·배경 제거를 하지 않는다. 투명·다중 프레임·EXIF 회전은 현재 차단한다.

완료 manifest.json에는 원본 SHA, CMYK JPEG SHA, ICC SHA, 픽셀 크기, 각 배치 결과를 기록한다. 실패 시 pending.json만 있는 폴더는 사용하지 않는다. 기존 출력 폴더는 덮어쓰지 않는다. 준비 성공은 이미지 변환 완료이고 finalApproved=false다. 저장소 파생 이미지 업로드·DB Job 생성·native PDF 작성기·최종 검사 Worker의 자동 연결은 아직 없다. 전체 47개 실제 원본과 공식 ICC로 CMYK 준비를 실행한 것은 아니다. 기술 테스트만 별도 시험 ICC로 4채널 JPEG 및 픽셀 크기 보존을 확인하며 Japan Color 출력 성공으로 간주하지 않는다.

### 묶음 폴더로 실행 및 실패 기록

ZIP을 푼 폴더를 `--bundle-dir`로 지정하면 inspection.json, document.json, originals를 함께 읽는다. 개별 입력 경로와 혼용하거나 알 수 없는 옵션·중복 옵션을 넣으면 실행하지 않는다. 원본별 시작·완료 및 전체 진행 수를 표시한다.

```powershell
node tools/prepare-production-cmyk-images.mjs --bundle-dir "D:\학사달력\production-v5-input" --output-dir "D:\학사달력\production-v5-cmyk-01" --icc "D:\profiles\JapanColor2011Coated.icc" --icc-sha256 "검증한_실제_프로파일_SHA256" --srgb-icc "D:\profiles\sRGB.icc"
```

경로는 실제 환경에 맞춘다. ICC SHA는 별도로 확인한 프로파일 값을 지정한다. 변환 도중 실패하면 새 출력 폴더의 failure.json에 실패 원본·교정 버전·내용 해시·완료 수·이유를 기록하고 종료 코드 1을 반환한다. 이 폴더는 완료 manifest가 없으므로 인쇄 입력으로 사용할 수 없다. 기존 출력 덮어쓰기나 실패 이미지 생략은 하지 않는다. 원인을 해결한 뒤 다른 새 출력 폴더로 재실행한다. 실제 47개 원본·공식 ICC 실행은 관리자 로컬 검증이 필요하다.

## 기존 인쇄 품질 검사 화면의 교정 버전 요청 연결

2026-10-04: 기존 화면의 최종 생성·검사 및 상태 갱신은 교정본일 때 POST /api/production-print-preflight로 분기한다. 관리자 인증 후 접수 ID + 교정 버전 ID로 저장본을 읽고, 클라이언트의 저장 해시와 비교한다. 현재 문서의 정렬 contentHash도 확인한다. 새 템플릿 Package 게시나 기존 DOM Worker 요청으로 보내지 않는다.

응답은 production-print-preflight.v1이고 jobCreated=false, status=blocked, finalApproved=false다. 네이티브 인쇄 정의·리소스와 Worker 연결이 아직 부족하므로 대기 Job이나 PDF를 생성하지 않는다. 기존 핵심 자동검사 영역에 버전·면수·원본 수·이미지 배치 수·전체 개체별 차단 사유를 표시한다. 같은 팝업에서 단계 이동 후 복귀하면 결과를 유지하며 검사 기록 JSON에도 productionInspection으로 포함한다. 다시 열면 결과를 재조회해야 하며 DB 검사 이력 저장은 아직 아니다. 새 SQL은 없다.

이 변경은 저장 버전으로 검사 요청을 고정하는 경계와 기존 화면 연결이다. 실제 네이티브 PDF 작성/Worker 처리 완료를 뜻하지 않는다. 내부 진단 메뉴 숨김은 실제 출력 연결을 정리한 뒤 진행한다. 다음은 공통 Runtime 복합 개체의 손실 없는 인쇄 구성요소 확장, 폰트·CMYK 리소스 보관, 그 입력을 소비하는 native Worker 처리 경로다.
