# RC4 QA Report

## 자동 검증
- Template Runtime TypeScript strict build
- Runtime regression test
- Designer Integration TypeScript strict build
- Legacy adapter integration test
- Designer Studio inline JavaScript syntax check
- ZIP integrity test

## 수동 확인
1. Designer Studio 열기
2. 새 템플릿 생성
3. 좌하단 `Runtime RC4` 배지 확인
4. 페이지 이동·개체 편집 후 페이지 수와 진단 건수 갱신 확인
5. 개발자 콘솔에서 `ACDLRuntimeBridge.lastDocument` 확인
6. `ACDLRuntimeBridge.getCurrentPage()`가 현재 페이지를 반환하는지 확인

## 실행 결과 (2026-07-30)
- Template Runtime `npm test`: 통과
- Designer Runtime Integration `npm test`: 통과
- Designer Studio inline script 12개 `node --check`: 통과
