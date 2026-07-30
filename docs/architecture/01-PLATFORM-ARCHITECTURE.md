# Calendar Publishing Platform Architecture v1.0

상태: Draft for Project 1 Release  
기준 제품: Calendar Template Designer v1.0 Beta

## 목적

현재 Project 1은 Designer Studio를 완성하고 독립 배포하는 단계다. 실제 학교 사용자가 사용하는 Calendar Workspace는 별도로 완성된 외부 MVP를 Project 2에서 분석하고 통합한다.

## 시스템 경계

```text
Calendar Publishing Platform
├─ Designer Studio
├─ Preview Workspace
├─ Calendar Workspace (Project 2)
└─ Platform Core
   ├─ Domain Model
   ├─ Schemas
   ├─ Template Runtime
   ├─ Calendar Engine
   └─ Publishing Contract
```

## 책임 분리

### Designer Studio 소유 영역

- 학사달력 도메인 정의
- CalendarType
- Template Schema
- Master / Page / Object 구조
- Binding 규칙
- Template 버전과 검증

### 외부 사용자 MVP 활용 영역

- 사용자 중심 UI/UX
- 챗봇 기반 초기 설정
- 공휴일·기념일·음력·24절기 데이터 연동
- 실제 제작 흐름
- 인쇄소 출력용 PDF

### 공동 계약

- Template Contract
- User Data Contract
- Runtime Input / Output
- Asset Contract
- Publishing Contract
- Version Compatibility

## 핵심 흐름

```text
CalendarType
  ↓
Template
  ↓
Master + Page
  ↓
Object + Binding + Asset
  ↓
Template Runtime
  ↓
Resolved Document
  ↓
Screen Renderer / Publishing Engine
```

## Project 2 최소 통합 목표

Designer Studio에서 내보낸 템플릿 1개를 외부 Calendar Workspace에서 읽고 학교 데이터와 학사일정을 적용한 뒤 인쇄용 PDF를 생성한다.
