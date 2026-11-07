# Roadmap

전체 제품 방향과 단계별 완료 기준은 [학사달력 에디터 서비스 전체 개발 방향](./docs/product/03-OVERALL-DEVELOPMENT-DIRECTION.md)을 따른다.

## v1.0 Beta — 완료

- Designer Studio 공개 베타 패키지
- Template Runtime 및 ResolvedDocument
- Legacy 프로젝트 어댑터
- Runtime 화면 미리보기
- SVG Publishing 중간 출력
- 자동 빌드·회귀·Studio 구문 검증

## v1.1 — 현재 구현 안정화

- 새 달력·템플릿 제작 흐름과 화면 상태 초기화
- 템플릿 전환, 텍스트 스타일, 개체 겹침·레이어 동작 수정
- 시스템 기본 템플릿 정책과 회귀 테스트 정비

## v2.0 — 공통 Schema·Runtime 개편

- Template Definition과 Calendar Document 분리
- 학교 데이터·학사연도·일정·자산 계약 확정
- 탁상형 Page Sequence와 벽보형 Publishing Layout 분리
- 텍스트 공간 초과, 이미지 프레임, 월별 변경값 공통화
- 기존 모듈의 유지·보강·교체·신규 판정 및 마이그레이션

## v2.1 — 대표 상품 구현

- 탁상형 박스 월력+플래너 대표 샘플
- 탁상형 이미지 콜라주+띠력 대표 샘플
- 벽보형 월력+월별 일정 목록 대표 샘플
- 벽보형 셀 일정·기간 막대·학교 운영정보 확장

## v2.2 — Calendar Workspace 통합

- 기존 사용자 MVP를 Runtime Contract에 연결
- 템플릿 선택 → 학교정보·일정·이미지 적용 → 최종 미리보기
- 사용자 편집 권한, 저장·재진입, 버전 호환 검증

## v2.3 — Publishing·우리학교인쇄 연동

- PDF/PNG 실제 파일 출력
- 재단선·안전영역·출혈·DPI·폰트 검증
- 상품·규격·페이지·가격 산정 정보 전달
- 완성 파일의 주문 흐름 전달
- 독립 검증 후 우리학교인쇄 운영 서버 배포

## MVP 이후

- Publishing Geometry Runtime 재설계
- Editor State·Command·History·Undo/Redo 중심 Editor Architecture 정비
- 학사달력 기반이 검증된 뒤 다른 학교 출판물 확장 검토

## Production v1.0 implementation
- [x] Sprint 1: Runtime-first foundations
- [ ] Sprint 2: Editor transform commands
- [ ] Sprint 3: Calendar runtime
- [ ] Sprint 4: Object system
- [ ] Sprint 5: Constraint layout
- [ ] Sprint 6: Publishing engine
- [ ] Sprint 7: Calendar Workspace
- [ ] Sprint 8: Designer Studio integration
- [ ] Sprint 9: Performance and history
- [ ] Sprint 10: Production release
