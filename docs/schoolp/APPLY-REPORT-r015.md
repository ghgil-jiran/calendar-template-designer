# schoolp r015 적용 보고서

## 프로젝트 진단

- 초기 빈 폴더: 아니오
- 기획 자료 보유: 예
- 구현 진행 중: 예
- 운영 가능한 앱: 독립 베타 수준
- schoolp 표준 적용: r015 적용 완료

## 자동 반영

- AI 작업 기준 문서
- requiredDocs 중 기존에 없던 문서
- `.claude/skills/`, `.agents/skills/` 전체
- `.claude/settings.json`, `.codex/hooks.json`
- `scripts/` 전체와 schoolp 업데이트 검사
- `.schoolp/starter-state.json`의 appliedStandard

## 수동 조정

- 현재 프로젝트는 Next.js가 아닌 정적 Designer Studio 구조이므로 `style:check`를 기존 화면 보존 검증으로 연결
- `build`는 기존 Runtime/통합/Studio 검증을 실행하도록 연결
- root CHANGELOG는 제품 이력으로 보존하고 starter 원본 이력은 `docs/schoolp/STARTER_CHANGELOG.md`에 별도 보관

## 건너뜀

- starter `src/**`
- `page.tsx`, `layout.tsx`, `globals.css`
- `tailwind.config.ts`, `postcss.config.js`, starter UI 컴포넌트
- Next.js dependencies
- 디자인 토큰
- 인증, 권한, 결제, 개인정보, 운영 DB, 실제 API
