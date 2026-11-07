# 공통 그래픽 라이브러리 — 첫 구현

모든 템플릿에서 공유하는 이미지 원본을 관리한다. 학교별 자료는 기존 학교 정보 및 에셋 관리 흐름을 유지한다.

- 첫 화면 관리 진입, 템플릿 설정 관리 진입, 편집 화면 선택 진입.
- PNG/JPEG/WebP 최대 20MB. 1MB 청크 업로드. 원본 변경 없음, 별도 PNG 썸네일.
- 파일 선택 시 확장자를 제외한 파일 이름을 기본 입력(수정 가능). 이름, 분류(배경/사진·일러스트/장식), 태그, 출처 메모.
- 검색·분류·사용중/보관됨 필터, 보관·복원. 영구 삭제 없음.
- 새 이미지 개체, 고정 이미지·프레임 교체, 현재 페이지 전체 배경 적용.
- 원본 ID와 등록 시점을 개체에 기록. 보관해도 사용한 템플릿의 원본 유지.
- 전용 비공개 common-graphics Storage의 graphics-library/{id}.json에 목록 메타데이터와 분할 파일 저장. 최초 관리자 접근 시 서버가 버킷 생성. 기존 이미지 전용 버킷의 MIME 제한 유지. 원본·썸네일은 기존 template_assets 내용 해시 저장 경로 재사용. 별도 SQL migration 없음.
- 모든 API는 기존 Master Admin 인증·갱신 경로 사용.

## API 계약

GET /api/template-assets?graphicLibrary=1 → {graphics: Graphic[]}; &id=UUID → {graphic: Graphic}.
POST operation=chunk, uploadId(UUID), index, total(1..20), data(base64 1MB 이하) → {index}.
POST uploadId, total, mimeType, previewDataUrl, width, height, name, category, tags, source, fileName → {graphic}.
PATCH id, status(active|archived) → {graphic}.
Graphic: schemaVersion, id, name, category, tags, source, width, height, originalAssetId, previewAssetId, mimeType, byteSize, fileName, status, createdAt, updatedAt.

## 검증과 제한

- 단위·저장 모의 테스트: 청크 원본 유지, 목록 재조회, 보관 후 원본 유지, 교체 시 위치·크기 유지, 학교 연결 이미지 보호.
- RGB 이미지도 화면에서 사용 가능. 이 기능은 CMYK 변환·출력조건 승인을 수행하지 않는다. 기존 네이티브 인쇄 기준의 최종 인쇄 적합성 검사는 별도로 유지한다.
- 배치 DPI는 화면에서 참고 경고만 표시한다.
- 썸네일 640px. 원본 교체·새 버전 편집·영구삭제·미완료 청크 자동 정리는 후속 범위.
