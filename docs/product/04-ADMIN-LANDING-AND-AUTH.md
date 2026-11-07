# 템플릿 에디터 랜딩과 Master Admin 로그인

## 화면

- 첫 화면은 공개 랜딩이며 학교용뿐 아니라 탁상형·벽걸이형·포스터·엽서·기업·개인 포토 달력까지 설계하는 범용 템플릿 에디터의 역할을 보여준다.
- 랜딩 하단은 `모든 형태의 달력`, `풍부한 디자인 요소`, `디자인을 템플릿으로`, `화면부터 인쇄까지` 네 가지 특징과 JIRANTECH 관련 서비스 푸터를 제공한다.
- 현재 2028 샘플 이미지는 임시 쇼케이스이며 여러 달력 제품 형태를 함께 보여주는 대표 이미지로 후속 교체한다.
- 주요 메뉴는 같은 크기의 `템플릿 라이브러리`, `새 템플릿 만들기`, `달력 유형 관리` 세 개다.
- `새 달력 만들기`와 별도 Designer Studio 환영 화면은 사용하지 않는다.
- 파일에서 템플릿 열기는 편집 화면의 보조 메뉴로만 유지한다.

## 권한

- 공개 회원가입은 제공하지 않는다.
- Supabase Authentication에서 만든 이메일·비밀번호 계정만 로그인할 수 있다.
- 로그인 계정은 `public.template_admins`에 활성 `master_admin`으로도 등록되어야 한다.
- 로그인 전에는 랜딩만 볼 수 있고 세 관리 메뉴 및 템플릿 API는 사용할 수 없다.
- 초안부터 검토·게시 상태까지 공용 원격 라이브러리에 저장한다.

## 데이터 모양

```text
template_admins
- user_id: auth.users의 계정 ID
- email: 관리자 이메일
- role: master_admin
- active: 사용 가능 여부
```

비밀번호는 템플릿 DB에 저장하지 않고 Supabase Authentication에서만 관리한다.

## 최초 계정 등록

1. Supabase `Authentication > Users`에서 이메일 계정을 만든다.
2. `supabase/migrations/202609030001_template_master_admin.sql`을 적용한다.
3. migration 하단의 등록 예시에서 이메일을 실제 관리자 이메일로 바꿔 실행한다.

2026-09-03 최초 Master Admin 계정과 migration 적용을 완료했다. 비밀번호와 secret 실제 값은 문서에 기록하지 않는다.
