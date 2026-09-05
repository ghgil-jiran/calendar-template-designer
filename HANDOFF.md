# Handoff

## 2026-09-05 최신 인수인계

- 현재 최우선은 `AI 디자인 에디터 v1.1`의 실제 생성 검증이다. 과거 검토 02 완성 항목을 현재 우선 작업으로 사용하지 않는다.
- `새 템플릿 만들기 → 상품·페이지 구성 → 템플릿 설정 ①~⑨` 중 ⑨ AI 디자인 생성에 실제 단일 배경 생성과 별도 초안 적용이 연결돼 있다.
- 회사 OpenAI API 키는 ⑨단계에서 Master Admin이 직접 등록하며 Supabase Vault에 암호화 저장한다.
- 실제 등록 전에 `supabase/migrations/202609050001_ai_design_openai_vault.sql`을 해당 Supabase 프로젝트에 한 번 적용해야 한다.

## 2026-09-03 이전 인수인계

- 템플릿 에디터 안정 기준: `main@2671761`, Vercel Production 배포 성공, 전체 Studio 테스트 189개 통과.
- 범용 달력 랜딩, Master Admin 이메일·비밀번호 로그인, Supabase `template_admins` 등록까지 완료했다.
- 다음 최우선 작업: [`[학사달력] 탁상형 검토 02 - 이미지 미니월력`](docs/product/05-DESK-REVIEW-02-COMPLETION.md)의 표지·연력·학교 상징 간지·월별 이미지/월력 12쌍·뒷표지 28면 완성.
- 샘플 3번 PDF에 최대한 가깝게 만들되 기존 Published Package와 검토 01은 변경하지 않는다.

## 다음 구현 단계 전에 개발자와 맞출 부분

1. 사용자 MVP가 편집기를 호출할 때 전달할 실행 파라미터
   - userId, schoolId, productId, templateId, projectId, returnUrl
2. 가격 산정 결과의 최종 권위
   - 화면 예상 금액과 우리학교인쇄 서버 확정 금액의 역할 분리
3. 최종 인쇄 파일 전달 방식
   - 업로드 API, 저장 위치, checksum, 재생성 정책, 보관 기간
4. 주문 상태와 제작 상태 매핑
   - 편집 중, 파일 생성, 검수, 주문 확정, 인쇄소 전달, 배송
5. 우리학교인쇄 운영 서버 배포 규칙
   - Node 버전, 빌드 명령, 정적 파일 또는 Next.js 서비스 방식, 환경변수, 로그/모니터링

## 자동으로 변경하지 않은 영역

- 다중 관리자 역할·초대·권한 관리
- 결제와 가격 확정 로직
- 개인정보 처리
- 운영 DB와 migration
- 우리학교인쇄 실제 API
- 인쇄소 전달 API
- 기존 UI와 디자인 토큰

## 템플릿 영구 저장 전환에서 맞출 부분

1. 개발·검토용 Supabase `calendar-editor-runtime-dev`에 `supabase/migrations/202608240001_template_persistence.sql` 적용 완료
2. Vercel 서버 환경에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등록 (`TEMPLATE_EDITOR_ACCESS_TOKEN`은 더 이상 사용하지 않음)
3. 서비스 키는 브라우저에 노출하지 않고 `/api/templates` 계열 서버 경로에서만 사용
4. `supabase/migrations/202609030001_template_master_admin.sql`을 적용하고 Supabase Auth에서 최초 사용자를 만든 뒤 `template_admins`에 `master_admin`으로 등록
5. 현재 단계는 단일 Master Admin 기준이며, 다중 사용자 초대·역할·권한은 이후 별도 설계
6. `template-assets`는 검토용 이미지 보관 범위이며 장기 보관·운영 자산 정책은 운영 전환 전에 재확인
7. 운영 전환 전 버전 보관 기간, 템플릿 삭제 방식, 이미지 미사용 자산 정리 정책 확정
8. 비공개 이미지 주소는 템플릿을 열 때마다 24시간 유효 주소로 다시 발급하며, 원격 프로젝트에는 `acdl-asset://<id>` 참조만 저장
