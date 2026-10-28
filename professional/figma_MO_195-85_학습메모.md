# Figma 학습 메모 — node 195:85 (모바일 보드)

> 출처: PROFESSIONAL-WEB, node 195-85 = "🟡260821-프로페셔널 부티크 **모바일**"
> 성격: MO(모바일) 버전 전체 화면 플로우 보드 (PC 보드 60-9의 모바일 짝)
> 학습일: 2026-10-22 · 아직 구현 아님, 참고용

## 영역별 MO 화면 구성 (frame 이름 기준)

### MAIN
- `MAIN-MO-kr-01` (히어로)
- `MAIN-MO-kr-02-1`, `-02-1-1`, `-02-1-2` (세부 분기 — POINT/성분 영역 추정)
- `MAIN-MO-kr-03-1`
- `MAIN-MO-kr-04-1`
- `MAIN-MO-kr-menu` (모바일 메뉴바)

### PRODUCT
- `PRODUCT-MO-kr-01`
- `PRODUCT-MO-kr-02`
- → 3-4 요구(펼쳐보기/모아보기, 스와이프+그라데이션)가 반영될 화면. 현재 코드엔 토글 미구현.

### STORE
- `STORE-MO-kr-01`, `STORE-MO-kr-02`
- 핵심 요소: `매장검색`(360×66) + `검색`/`지도` 텍스트 + 결과 `button`(360×32) 리스트
- 지도(네이버 Maps) + 검색 리스트 분할 구조의 모바일 버전

### ARTICLES
- `ARTICLES-MO-kr-01`

### PRO
- `PRO-MO-kr-01` (게이트/대문)
- `PRO-MO-kr-02-1` (인증 후 메인)
- `PRO-MO-kr-02-2-1 ~ 2-3` (제품/섹션 분기)
- `PRO-MO-kr-02-3-1 ~ 3-3` (추가 섹션 분기)

## 공통 컴포넌트 (반복 등장)
- `menu bar` / `menu_b 1` (헤더 메뉴, 46회) · `logo` (41회)
- `grid` (상품 그리드, 24회) · `box` (36회)
- `Mask group` (189회 — 이미지 마스킹 다수)

## 메모
- 원본 메타데이터(409K자) 전체 저장 위치:
  `.../tool-results/mcp-figma-get_metadata-1792637174317.txt`
  (jq로 `.[].text` 추출 → XML 구조. 세부 좌표/크기 필요 시 재조회)
- 실제 구현 착수 시: 해당 영역 `get_design_context`로 색/치수/카피 받아
  라이브 CSS와 1:1 대조 후 작업 (Playwright 실측 검증 절차 적용)
