import type {CatalogResponse, SchoolField, TemplateCard} from '../lib/api/contracts';

// Deliberately a review fixture. No admin APIs, customer data, or registry credentials.
const fields: SchoolField[] = [
  {key: 'name', label: '학교명', group: 'basic', required: true, allowHide: false, maxLength: 80, hint: '달력에 인쇄할 학교명을 입력해 주세요.'},
  {key: 'englishName', label: '학교 영문명', group: 'basic', required: false, allowHide: true, maxLength: 120},
  {key: 'slogan', label: '학교 슬로건', group: 'basic', required: false, allowHide: true, maxLength: 160},
  {key: 'address', label: '학교 주소', group: 'contact', required: false, allowHide: true, maxLength: 200},
  {key: 'academicPhone', label: '교무실 전화', group: 'contact', required: false, allowHide: true, maxLength: 40},
  {key: 'adminPhone', label: '행정실 전화', group: 'contact', required: false, allowHide: true, maxLength: 40},
  {key: 'fax', label: '팩스', group: 'contact', required: false, allowHide: true, maxLength: 40},
  {key: 'website', label: '학교 홈페이지', group: 'contact', required: false, allowHide: true, maxLength: 160, hint: '표시를 원하지 않으면 아래에서 제외할 수 있어요.'}
];

export function pageLabel(number: number): string {
  if (number === 1) return '표지';
  if (number === 2) return '연력';
  if (number === 3) return '학교 상징';
  if (number === 28) return '뒷표지';
  return `${(Math.floor((number - 4) / 2) + 2) % 12 + 1}월 월력 ${number % 2 === 0 ? '뒷면' : '앞면'}`;
}
const imageUrl = (number: number): string => `/api/workspace/previews/${number}`;
const definitions = [
  {id: 'review-flower', name: '플라워 사진형', description: '계절의 꽃과 학교 사진을 따뜻하게 담아요.', cover: 1, note: '샘플 A의 기존 확인용 PDF 참고 이미지', kind: 'reference'},
  {id: 'review-landscape', name: '사계절 산수 사진형', description: '사계절의 분위기와 학교 사진을 함께 담는 구성이에요.', cover: 8, note: '선택 흐름용 예시 · 실제 디자인 이미지 연결 전', kind: 'shared-example'},
  {id: 'review-planner', name: '사계절 산수 · 자기주도계획표', description: '날마다 계획을 기록할 수 있는 구성의 예시예요.', cover: 12, note: '선택 흐름용 예시 · 실제 디자인 이미지 연결 전', kind: 'shared-example'},
  {id: 'review-photo', name: '학교 사진 중심형', description: '학교의 일상과 추억을 사진으로 담는 구성의 예시예요.', cover: 16, note: '추가 디자인 가정 · 실제 상품 아님', kind: 'shared-example'},
  {id: 'review-simple', name: '간결한 정보형', description: '학교 정보와 일정을 차분하게 보여주는 구성의 예시예요.', cover: 2, note: '추가 디자인 가정 · 실제 상품 아님', kind: 'shared-example'}
] as const;

export function reviewCatalog(): CatalogResponse {
  const templates: TemplateCard[] = definitions.map(item => ({
    id: item.id, version: 1, name: item.name, description: item.description, note: item.note,
    previewKind: item.kind, coverUrl: imageUrl(item.cover), representativePages: [5, 4, 2, 3],
    pageCount: 28, widthMm: 260, heightMm: 180, period: '2027년 3월 ~ 2028년 2월',
    pages: Array.from({length: 28}, (_, index) => ({number: index + 1, label: pageLabel(index + 1), imageUrl: imageUrl(index + 1)})),
    composition: [{label: '표지', count: 1}, {label: '연력', count: 1}, {label: '학교 상징', count: 1}, {label: '월력 앞뒤', count: 24}, {label: '뒷표지', count: 1}],
    fields: structuredClone(fields), photoGuide: '사진은 여러 장을 모아 올린 뒤, 교체 가능한 프레임에서 선택해요.'
  }));
  return {mode: 'review', notice: '개발 검토용 · 5종 선택 예시입니다. 미리보기는 샘플 A의 공통 참고 이미지입니다. 실제 템플릿·로그인·서버 저장은 연결 전입니다.', templates};
}
