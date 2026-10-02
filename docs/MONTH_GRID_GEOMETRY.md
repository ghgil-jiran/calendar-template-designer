# 월력 영역 고정 — 첫 단계

calendarLayout.fixedGeometry (monthly-grid-geometry.v1)에 기존 titlePercent, weekdayTrackMm, weekdayGapMm를 기록한다. 첫 편집 렌더링 시 기존 계산 결과를 그대로 보존한다. 표시 형식이나 요일 스타일 변경은 이 값에 영향을 주지 않는다. 기존 전체 월력 영역의 이동·크기 변경은 유지한다.

공통 shared-screen-calendar-layout.js가 에디터와 사용자 서비스에 동일하게 적용된다. calendarLayout은 기존 Runtime/스냅샷 변환에서 전달되므로 별도 사용자 서비스 좌표 보정 없음. 기존 저장본은 에디터에서 열고 저장하기 전까지 구형 계산으로 표시된다.

월 표시의 독립 개체·종류별 mm 기본값 설정·겹침 안내는 다음 단계. 현재 UI 선택은 기존 월력 Master를 유지한다. 인쇄 경로의 최종 정합 검증은 독립 개체 정의가 완료된 뒤 진행한다.

## 두 번째 단계 — 월 표시 배치 분리

calendarLayout.monthTitle (monthly-title-object.v1)에 독립 frame을 보존한다. calendarRegion은 요일+날짜 격자 영역으로 변환하며 fixedGeometry.titlePercent=0. 변환은 한 번만 적용한다. 월 표시는 기존 형식/연도/월/글자 크기를 계속 사용한다. 드래그 및 배치 입력은 월 표시와 격자를 각각 대상으로 삼는다. 현재 두 배치는 12개월 공통이며 월별 별도 제목 배치와 글꼴/구성요소별 색상 확장은 후속.

Runtime은 기존 calendar 개체 계약 안에서 분리된 제목 배치를 전달한다. 사용자 서비스는 공유 relativeTitleFrame으로 원본 좌표를 변환해 표시한다. 독립 개체로서의 삭제·레이어 변경 및 인쇄 경로의 최종 정합 검증은 아직 완료하지 않았다.

## 월 표시 스타일 확장 (Preview)

`calendarLayout.monthTitle.style`에 선택적으로 글꼴, 굵기, 월 숫자·연도·영문 월·한글/직접 입력 제목 각각의 크기(px)와 색상, 구성 요소 간격, 연도/영문 월 세로 간격을 저장한다. 빈 값은 기존 스타일을 상속하며 별도의 기본값으로 덮어쓰지 않는다. 화면의 공통 월 표시 모듈이 에디터와 사용자 서비스에서 같은 마크업을 생성한다. 스타일 변경은 frame과 calendarRegion을 변경하지 않는다. 큰 글자는 월 표시 frame 안에서 잘리므로 frame 크기를 직접 조정해야 한다.

요일 높이는 분리된 격자 영역의 실제 mm 높이를 기준으로 계산한다. titlePercent=0을 10%로 대체하지 않는다.

유형·종류별 격자 기본값 관리에는 calendar_type_sizes에 새 저장 필드와 서버 매핑이 필요하다. 현재 DB에는 크기 숫자만 있으며 임의로 다른 필드를 재사용하지 않는다. 이 단계는 후속 마이그레이션과 함께 구현한다. 기존 템플릿의 자동 배치 변경은 하지 않는다. 네이티브 PDF 조판의 스타일 반영과 실제 폰트 출력은 별도 확인이 필요하다.

## 화면 배율·폰트 정합 (2026-10-02 Preview)

- 에디터의 기준 페이지 폭은 가로형 850px, 세로형 720px이다. 사용자 서비스의 스냅샷 페이지를 동일한 기준으로 해석한다.
- 월 표시의 저장 크기·간격은 px 숫자로 그대로 유지한다. 공통 화면 모듈에 referenceWidthPx/baseSize를 전달하면 화면 CSS는 해당 페이지 container의 cqw로 변환한다. 격자 frame이나 월 표시 frame의 크기는 변경하지 않는다. 기존 px 출력 API는 context를 생략하면 유지된다.
- 에디터 .page와 사용자 서비스 RuntimeSnapshotPage를 inline-size container로 설정한다. 월 표시 frame의 폭이 달라져도 글자 크기는 페이지 폭을 기준으로 한다.
- 공통 폰트 stylesheet를 양쪽에서 동일하게 사용한다. Pretendard 1.3.9와 Noto Sans KR/Noto Serif KR/Nanum Gothic/Nanum Myeongjo/Playfair Display를 로드한다. Arial/Times New Roman은 시스템 폰트이며 외부 폰트 로드 실패와 합성 굵기 여부는 브라우저 확인이 필요하다.
- 자동 검증: 원격 저장 API mock의 save/load 왕복, Package JSON 직렬화 및 사용자 데이터 교체 후 변환, 소수점 글자 크기·간격·색상·폰트·순서 보존, 320/기준폭/1100px에서 비례 계산 검증.
- 실제 Supabase 저장·Preview 시각 비교 및 네이티브 PDF 검증을 완료한 것으로 보지 않는다. 별도 달력 개체의 실제 frame/변환 기준 정합, 공통 인쇄 Runtime 연결, 유형별 격자 기본값 관리가 남아 있다.
