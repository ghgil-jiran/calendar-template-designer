# 인쇄 주문 연동 계약 초안

이 문서는 구현 전 협의용 초안이며 실제 우리학교인쇄 API 계약이 아니다.

## 편집기 실행 입력

```json
{
  "userId": "string",
  "schoolId": "string",
  "productId": "string",
  "templateId": "string",
  "projectId": "string",
  "returnUrl": "string"
}
```

## 가격 산정 결과

```json
{
  "productType": "academic-calendar",
  "size": "260x180",
  "quantity": 300,
  "pageCount": 32,
  "paper": "string",
  "finishing": [],
  "estimatedAmount": 0,
  "currency": "KRW",
  "calculationVersion": "string"
}
```

화면 금액은 예상 견적으로 취급하고, 주문 확정 시 우리학교인쇄 서버가 같은 입력을 재검증하는 방식을 권장한다.

## 최종 인쇄 파일 결과

```json
{
  "projectId": "string",
  "orderId": "string",
  "fileId": "string",
  "fileType": "print-pdf",
  "pageCount": 32,
  "trimSize": { "width": 260, "height": 180, "unit": "mm" },
  "bleedMm": 3,
  "checksum": "string",
  "generatedAt": "ISO-8601"
}
```

## 구현 전 확인 사항

- 업로드 URL 발급 방식
- 파일 크기 제한과 재시도
- PDF/X 등 인쇄 표준
- 파일 보관 기간과 재생성 정책
- 예상 금액과 확정 금액의 불일치 처리
- 주문 취소 또는 편집 재개 시 파일 버전 처리
