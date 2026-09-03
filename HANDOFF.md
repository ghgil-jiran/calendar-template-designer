# Handoff

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
