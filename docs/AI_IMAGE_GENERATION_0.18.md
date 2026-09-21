# AI 이미지 생성 기준 0.18

## 목적

상업용 학사달력의 배경과 포인트 이미지를 과장된 장면이 아니라 편집 개체를 돕는 절제된 인쇄 자산으로 생성한다. 프롬프트 길이로 통제하지 않고 페이지 설정에서 이미지 역할과 시각 비중을 먼저 결정한다.

## 감사 결과

- 기존 공통·스타일·페이지 규칙은 같은 금지 항목을 여러 번 반복했다.
- 보호영역 좌표는 충분했지만 이미지가 페이지에서 맡는 역할과 허용 면적이 명시적이지 않았다.
- 모든 AI 이미지는 1536×1024로 생성됐으나 제작 크기 기준 목표 픽셀과 업스케일 필요 여부가 계약에 없었다.
- 출력 설정에서 관리자가 PDF·DPI·도련·CMYK 같은 제품 고정값을 변경할 수 있었다.

## 생성 계약

페이지별 `GenerationContext`는 다음 값을 가진다.

- `imageRole`: `full-bleed-background`, `supporting-background`, `feature-illustration`, `accent-illustration`, `no-ai-image`
- `visualWeight`: `quiet`, `supporting`, `featured`
- `objectRelationship`: `avoid`, `integrate`, `focus`
- `decorationCoveragePercent`: 시각 비중별 허용 면적
- `printImagePlan`: 제작 크기, 목표·최저 DPI, 필요 픽셀, 1차 생성 크기, 유효 DPI, 업스케일 필요 여부

기본 분류는 다음과 같다.

| 페이지 | 기본 역할 | 비중 | 원칙 |
|---|---|---|---|
| 표지 | full-bleed-background | supporting | 연도·학교 사진·학교 정보와 한 구도로 결합 |
| 연력 | supporting-background | quiet | 12개월 정보가 주인공이며 가장자리만 사용 |
| 학사일정·연간계획 간지 | supporting-background | quiet | 기능 영역을 피하고 외곽에만 포인트 |
| 일반 간지 | supporting-background | supporting | 실제 개체 정렬축과 연결하되 대체하지 않음 |
| 월력 앞면 | accent-illustration | quiet | 0~12% 안에서 한 가지 변화만 허용 |
| 사진·기능 중심 월력 뒷면 | supporting-background | supporting | 교체 사진·플래너를 주인공으로 유지 |
| 일러스트 중심 월력 뒷면 | feature-illustration | featured | 실제 빈 영역에서만 주 시각 허용 |
| 뒷표지 | supporting-background | quiet | 정보 영역을 비우고 표지의 축약된 마감만 사용 |

## 인쇄 프로필

- 완성 크기: 260×180mm
- 제작 크기: 266×186mm
- 도련: 3mm
- 목표: 300 DPI, 3142×2197px
- 1차 생성: 1536×1024px, 제작 크기 환산 약 140 DPI
- 결론: 1차 생성본은 인쇄 원본으로 바로 승인하지 않고 후속 업스케일과 4단계 전용 검사를 거친다.
- 최종 출력: PDF/X-4, CMYK, Japan Color 2011 Coated, K100

## 화면별 적용

- 편집 화면: 재단·안전영역 가이드와 실제 편집 개체를 기준으로 배치한다.
- 검토용 PDF: 편집 화면과 동일한 페이지·개체 구조를 검토한다.
- 인쇄 품질 PDF: 제품 고정 프로필을 적용하고 자동검사한다.
- AI 이미지: 제작 크기를 기준으로 목표 픽셀과 업스케일 필요 여부를 자산 메타데이터에 기록한다.

관리자는 제품 고정 기술값을 직접 바꾸지 않는다. 출력 설정에서는 검토 페이지 범위, 검토 이미지 품질, 화면 가이드만 선택한다.

## 다음 단계

0.18은 생성 규칙과 인쇄 계획 계약까지 적용한다. 실제 업스케일러 선택·실행과 4단계 `ai-image-print-quality.v1@0.1.0`의 6개 검사 연동은 생성 결과 비교 후 별도 단계에서 진행한다.
