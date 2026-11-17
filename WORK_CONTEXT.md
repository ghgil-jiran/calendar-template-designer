# 샘플 D v4
- 기존 v3 브랜치 기반, 28면 v4 데이터와 원본 PDF 포함.
- /apps/designer-studio/sample-d-save.html 에서 기존 관리자 인증 후 등록·저장 가능.
- /api/sample-d-installation POST start → document index 0..4 → save → verify.
- 테스트 2개 통과. 실제 저장은 아직 실행하지 않음.
- 임시 Preview 접근 링크 생성은 자동 승인 검토에서 추가 접근 승인 부재로 거절됨. 우회 금지.
- 다른 로컬 작업 디렉터리의 미커밋 변경은 포함하지 않음.

## 2026-11-16 샘플 A v3 디자인 수정
현재: v3 원본 ID 43205e86-a694-4f5f-9ae6-60d2ff45e915, versionId 9868c607-2c9f-4b21-90db-ff2f54bc0faf. 사용자 제공 검토 JSON의 실제 개체에 맞춰 수정 변환/인증된 적용 버튼 구현. PDF 배경·패키지·페이지·학교 자료 해시 보존. 주아 WOFF 번들 및 일정 8.5pt 렌더 opt-in. 실제 저장과 인쇄 검증은 사용자 실행 전. Preview 확인 후 관리자 적용; 자동 게시/Production 승격 금지.
검증: 관련 17개/스타일/정적 빌드/사용자 앱 빌드 통과. 기존 root 전체 검사는 버전 문자열/카탈로그 기대값 등 실패가 남음.

## 2026-11-17 샘플 A 인쇄 검사 스타일 등록
네 속성(cornerRadiusMm/textDecorationColor/textDecorationThickness/textUnderlineOffset)을 지원 개체/값에 한해 등록. 관련 50개·스타일·정적 빌드·공통 사용자 렌더러 생성 통과. v8 저장 원본 미등록 스타일 0건. 사용자 최신 v9 데이터는 수정하지 않음. 향후 새 스타일은 저장/Runtime/공식 검사 등록/변환 결과 preflight를 함께 검증. 전체 검사 기존 실패 9개와 실제 최종 인쇄 검증은 별개로 보고.
