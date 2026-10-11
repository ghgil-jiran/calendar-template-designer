# 템플릿 사용자 편집 권한

## 적용 범위

2026-10-11 에디터 단계. 기존·신규 ACDL 템플릿에 `template-user-editing.v1`을 적용한다. 사용자 서비스의 조작 기능, 접수 문서 통합, 관리자 읽기 전용 검수 연결은 후속 작업이다.

기존 템플릿은 불러오기·렌더링·저장·게시 패키지 생성 때 정규화한다. 보관된 DB 원본과 이미 게시한 패키지를 일괄 수정하지 않는다. 기존 템플릿을 저장하면 새 저장본에 권한이 기록되며 사용자 서비스 전달에는 새 패키지 생성·동기화가 필요하다.

## 저장 계약

- `template.userEditing.schemaVersion`: `template-user-editing.v1`
- `template.userEditing.additions`: `{image: boolean, text: boolean}`. 누락값은 금지.
- `book.pageInstances[].userEditing.additions`: `{image?: boolean, text?: boolean}`. 누락은 템플릿 기본값 상속, 명시값은 해당 면의 예외.
- `template.userEditing.userAddedPermissions`: 사용자 추가 개체의 이동·크기·회전·색상·콘텐츠·삭제·복제·레이어·이미지 교체·내부 맞춤 허용.
- `template.userEditing.pageStructure`: 면 추가·삭제·재정렬·규격 변경 모두 금지.
- 기존 개체 및 중첩 개체: `userEditingSchemaVersion`, `permissions`의 모든 항목을 명시한다. Master 개체도 같은 기준을 사용한다.

개체 권한은 `move`, `resize`, `rotate`, `color`, `content`, `delete`, `duplicate`, `layer`, `replaceImage`, `imageFit`이다. `replaceImage`는 사진 원본 교체, `imageFit`은 프레임 내부 위치·확대·회전 조정이며 프레임 자체의 배치 권한과 독립이다.

## 정규화 기준

기존에 저장된 명시적인 개체 권한은 유지한다. 누락된 배치·스타일 권한은 금지로 채운다. 이전의 잠금·선택 불가 개체는 최초 정규화 시 배치·스타일을 보호한다. `required` 개체는 삭제 권한이 있어도 삭제 금지다.

이미지 교체는 기존 명시적 금지, 교체 불가 표시를 우선한다. 교표와 `managed-school-asset`은 면별 교체를 금지한다. 그 밖의 명시적 허용·사용자 사진 용도·월별/표지/마지막 사진 연결은 허용한다. 내부 맞춤 값이 없으면 기존 사진 교체 허용값을 따른다. 이후에는 내부 맞춤과 교체를 따로 저장한다.

공통 기준은 `apps/designer-studio/persistence-project.js`의 `ACDLUserEditingPolicy`다. 브라우저 저장·복원·해시, 에디터 정규화, 서버 버전/초안 저장, 게시 패키지 생성에서 사용한다. 접수된 제작 교정 프로젝트(`productionCorrection`)는 자동 정규화하지 않는다.

## 화면

개체 선택 → 권한 탭에서 개체별 편집, 템플릿 추가 허용, 현재 면의 추가 허용을 설정한다. 같은 월력 전체 적용은 개체 권한만 전파하며, 현재 면의 추가 예외는 다른 면에 복사하지 않는다. 변경 전·저장 후 버튼은 비활성화된다.

## 확인

`tests/user-editing-policy.test.mjs`: 기존 템플릿/Master/중첩 개체 정규화, 레이아웃 보존, 사진 교체와 내부 맞춤의 분리, 저장·재불러오기, 면별 상속/예외, 서버 저장 계약, 게시 패키지 포함, 제작 교정본 보호, 월력 권한 적용을 검증한다.

후속 사용자 서비스는 이 계약을 읽고 UI 및 최종 저장 검증에 함께 적용해야 한다. 에디터 권한 저장만으로 사용자 조작 기능이 열리지는 않는다.
