# AI 디자인 OpenAI API 연결

## 저장 위치

회사 OpenAI API 키는 Supabase Vault의 `ai_design_openai_api_key`로 암호화 저장한다. 일반 테이블, 템플릿 JSON, 브라우저 저장소, GitHub와 화면 응답에는 저장하거나 표시하지 않는다.

## 최초 1회 준비

Supabase SQL Editor에서 아래 migration 파일 전체를 실행한다.

`supabase/migrations/202609050001_ai_design_openai_vault.sql`

이 migration은 Vault를 활성화하고 키 저장·조회 함수를 만든다. 두 함수의 실행 권한은 `service_role`에만 허용한다.

## 키 등록 또는 교체

1. 배포된 템플릿 에디터에서 Master Admin으로 로그인한다.
2. `새 템플릿 만들기 → 상품·페이지 구성 → 템플릿 설정 → ⑨ AI 디자인 생성`으로 이동한다.
3. `OpenAI API 연결`에 회사 키를 입력한다.
4. `Supabase Vault에 저장`을 누른다.
5. `연결됨 · Supabase Vault` 표시를 확인한다.

등록한 키는 다시 표시되지 않는다. 키를 교체할 때는 같은 입력란에 새 값을 저장하면 기존 Vault 항목이 갱신된다.

## 첫 동작 확인

⑨단계에서 스타일을 고르고 `새 AI 배경 1개 생성`을 누른다. 생성 결과를 선택하기 전에는 템플릿에 적용되지 않으며, 선택 결과도 기존 원본이 아닌 별도 초안에만 적용된다.

## 접근 경계

- 키 등록·상태 확인·이미지 생성은 모두 Master Admin 인증이 필요하다.
- 브라우저에는 연결 여부만 반환한다.
- OpenAI 호출은 Vercel 서버에서만 수행한다.
- 키 값은 로그와 오류 응답에 포함하지 않는다.
