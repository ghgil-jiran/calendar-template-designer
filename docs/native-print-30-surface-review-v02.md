# 30면 대표 템플릿 네이티브 인쇄 검토 v02

## 검토 목적

페이지별 구성 유형을 전부 확장하기 전에 대표 템플릿 하나가 에디터 개체에서 Package, Runtime, Print Document, 네이티브 CMYK PDF까지 동일하게 이어지는지 확인한다.

이번 검토본은 실제 학교 자산을 적용한 최종 디자인이 아니다. 승인된 CMYK 검사용 이미지와 샘플 학교 데이터를 사용한다.

## 대표 구성

- 표지: 왼쪽 사진형
- 표지 안쪽면: 월별 개별 박스형 연력
- 앞 간지 앞면: 학교 상징
- 앞 간지 뒷면: 학사 일정
- 월력 앞면: 달력 중심형, 왼쪽 월 제목형
- 월력 뒷면: 대표 이미지, 현재월 미니 월력, 학사 일정, 체크리스트, 월 띠력
- 뒷표지 안쪽면: Yearly Plan
- 뒷표지: 학교 정보형

## 산출물

- `output/pdf/native-full-30-surfaces-v02.pdf`
- `output/pdf/native-full-30-surfaces-v02.resolved-document.json`
- `output/pdf/native-full-30-surfaces-v02.print-document.json`
- `output/pdf/native-full-30-surfaces-v02.package-bundle.json`
- `output/pdf/native-full-30-surfaces-v02.structure.json`

기존 `v01` 산출물은 수정하거나 삭제하지 않았다.

## 자동 검사 결과

- 15장·30면 생성: 통과
- 페이지 순서: 통과
- 3월부터 다음 해 2월까지 월력 앞·뒷면 12쌍: 통과
- Package 인쇄 승격: 77개 중 77개 통과, 차단 0개
- Runtime 문서: 30면, 원본 개체 275개
- Print Document: 30면, 달력·일정·계획표 확장 후 네이티브 노드 4,553개
- 모든 Runtime 원본 개체가 Print Document source object로 유지됨
- 모든 Runtime 원본 개체에 최종 print policy 존재
- 게시 Bundle을 사용자 서비스 Runtime Bridge로 다시 조립하는 소비자 왕복 검사: 통과
- 사용자 서비스 Package Loader가 요구하는 `manifest.files` 계약: 통과
- 사용자 서비스 Snapshot Adapter 변환: 30면·275개 개체, 오류 0건, 경고 0건
- 사용자 서비스 Preview Model 변환: 30면, 월력 앞면 월 모델 12개
- 학교 자산과 12개월 이미지를 주입한 사용자 Dataset 바인딩: 이미지 17개, 빈 이미지 0개
- 물리적 페이지 role과 콘텐츠 목적 분리 및 현재 콘텐츠 표시명: 통과
- 사용자 서비스 검토 Registry의 네이티브 자산 계약: CMYK JPEG, OTF 폰트, OFL 라이선스 유형 확인
- PDF/X-4: 통과
- OutputIntent `Japan Color 2011 Coated`: 통과
- PDF 1.7, 30페이지: 통과
- MediaBox·BleedBox: 266×186mm
- TrimBox: 260×180mm
- PDF 폰트 객체 없음: 글자 아웃라인 출력 확인
- 포함 래스터 이미지: 모두 4채널 CMYK JPEG
- 대표 이미지 실배치 해상도: 약 307.9dpi
- 내부 네이티브 PDF 구조검사: 통과

## 실제 렌더링 검사

전체 30면 썸네일과 다음 대표 구간을 렌더링해 확인했다.

- 1~4면: 표지, 표지 안쪽면·연력, 앞 간지 앞면·학교 상징, 앞 간지 뒷면·학사 일정
- 5~6면: 3월 월력 앞면·뒷면
- 15~16면: 8월 월력 앞면·뒷면
- 29~30면: 뒷표지 안쪽면·Yearly Plan, 뒷표지·학교 정보

판정:

- 빈 면 없음
- 페이지 순서 오류 없음
- 깨진 한글·숫자 없음
- 주요 개체 잘림 없음
- 12개월 월·연도 전환 정상
- 월력 날짜는 7열 좌표에 맞게 생성됨
- 월력 뒷면의 이미지, 미니 월력, 학사 일정, 체크리스트, 월 띠력 반복 생성 정상
- 학사 일정의 일정 없는 달은 `일정 없음`으로 유지

## 아직 완료로 판정하지 않는 항목

- CMYK 그라데이션 이미지는 실제 학교 자산이 아니므로 사진 품질 판정 제외
- 에디터 화면과 사용자 서비스 화면의 실제 픽셀 비교 미실시
- 사용자 서비스의 게시 템플릿 선택·사용자 데이터 입력·재출력 흐름 미실시
- 실물 인쇄와 재단·제본 상태 확인 미실시

## 다음 확인

게시 형식 Package의 사용자 서비스 Runtime Bridge 조립까지 통과했다. 다음은 이 Package를 사용자 서비스의 검토 Registry에 올린 격리된 Preview에서 불러와 화면 Renderer, 사용자 데이터 입력, 저장·재열기를 확인한다. 사용자 서비스 미리보기와 네이티브 PDF에서 페이지 순서, 개체 수, 좌표, 스타일, 바인딩이 에디터 기준과 동일한지 확인한 뒤 다른 구성 유형 확장을 재개한다.
