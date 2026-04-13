# 달바 부티크 메인페이지

## 프로젝트 개요
- 달바(d'Alba) 부티크 공식몰 메인페이지 리뉴얼 작업
- 고도몰(Godo Mall) 기반 쇼핑몰
- 고도몰 관리자에서 HTML/CSS 파일을 다운로드하여 로컬에서 수정 후 반영하는 방식

## 고도몰 폴더 구조 (dalba_main)
```
abc/abc
게시판/board
collection/collection
component/component
스타일시트/css
이벤트 페이지/event
fonts/fonts
상품/goods
hometry/hometry
인트로/intro
스크립트/js
메인/main          ← 현재 작업 대상 (test_260408.php)
회원/member
마이 페이지/mypage
주문/order
전체 레이아웃/outline
팝업창 페이지/popup
기타 페이지/proc
renewalindex/renewalindex
고객 서비스/service
공용 페이지/share
signature/signature
story/story
subscription/subscription
test/test
```

## 현재 작업 파일
- `index.html` = 고도몰 `메인/main/test_260408.php`
- 고도몰 템플릿 문법 사용: `{=includeWidget()}`, `{=setBrowserCache()}` 등

## 외부 의존성
- Flickity 슬라이더: `/js/slider/flickity/`
- 고도몰 기본 테마 CSS: `/data/skin/front/dalba2/` (로컬에 없음, 고도몰 서버에 존재)
- `data-text-color`, `data-background-image`, `data-theme` 등 커스텀 속성은 고도몰 테마 JS가 처리

## 피그마 디자인
- https://www.figma.com/design/ZjQIZw0VJcim9ury1H08th/

## 작업 요구사항
1. 메인 배너 영역: 텍스트 크기 조정, 버튼 텍스트/라인 컬러 적용 안되는 문제 해결
2. 베스트 프로덕트 영역: 배너/텍스트/버튼 컬러 변경
3. 인스타그램 영역: 자동 업데이트 (보류)

---

## ⚠️ 고도몰 템플릿 파일 편집 시 주의사항 (실제로 여러 번 장애 발생)

### 문제 요약
고도몰 템플릿 파일(`*.html`, `*.php`)은 `<!--{ ? ... }-->`, `{=variable}`, `{ # header }` 같은 특수 문법을 사용한다. 이 문법은 **서버에서 렌더링될 때** JS/HTML로 치환되는데, IDE/편집기가 이걸 모르고 자동 포매팅하면 문법이 깨지면서 **서비스 장애**가 발생한다.

### 실제 발생한 장애 사례
- `_header.html`의 `<!--{ / }-->` 가 `< !--{ / }-->` 로 변질 (공백 삽입) → `<script>` 블록 syntax error → `gdCurrencySymbol` 전역변수 미정의 → 상품상세의 +/-/x 버튼 전부 미동작
- `goods_view.html`의 JS 문자열 안에 raw newline 삽입됨 → `Uncaught SyntaxError: Invalid or unexpected token` → `goodsNo` 미정의 → 구매하기/리뷰/선물하기 버튼 전부 미동작
- `<!--{ ? ... }-->` 와 JS 코드가 한 줄로 합쳐져서 `//` 주석 뒤 코드가 통째로 주석 처리되는 현상

### 편집 원칙 (필수 준수)
1. **자동 포매팅(Prettier, Format on Save 등) 절대 사용 금지** — 이 파일들 수정 시 IDE 설정에서 format on save 끄고 수동 편집만
2. **복사/붙여넣기 후 반드시 diff 확인** — 붙여넣기 과정에서 에디터가 공백/개행을 임의 삽입할 수 있음
3. **JS 문자열 리터럴은 한 줄로 유지** — single/double quote 안에 raw newline 금지 (template literal 백틱 안 쓰는 이상)
4. **`//` 한 줄 주석 뒤에 코드 금지** — 한 줄 주석은 줄 끝까지 주석 처리하므로 뒤에 붙은 코드가 사라짐

### 편집 후 검증 체크리스트
고도몰에 업로드하기 전 아래 패턴들이 파일에 **없는지** grep으로 확인:
- `< !--` (공백) → 있으면 전부 `<!--` 로 복구
- `-- >` (공백) → 있으면 전부 `-->` 로 복구
- JS 문자열 내 줄바꿈 (예: `alert('...` 이 다음 줄로 이어짐)
- 같은 줄에 `//주석 코드();` 패턴

일괄 복구 명령 (수동 확인 후 실행):
```bash
sed -i '' 's/< !--/<!--/g; s/-- >/-->/g' <파일명>
```

### 실제 브라우저 테스트 필수
IDE 린터는 고도몰 문법을 모르기 때문에 **수백 개 거짓 경고**를 냄 (예: 635개). 이것들은 대부분 무시해도 된다. **진짜 오류는 브라우저 DevTools Console에서만 확인 가능**:
- F12 > Console 탭에서 빨간 `Uncaught SyntaxError`, `Uncaught ReferenceError` 가 있으면 파일 수정 후 재업로드 필요
- 수정 → 고도몰 업로드 → Cmd+Shift+R로 캐시 비운 새로고침 → Console 확인 루프

### 자주 수정하는 파일 위치
- `_header.html` → 고도몰 `전체 레이아웃/outline/_header.html`
- `goods_view.html` → 고도몰 `상품/goods/goods_view.html`
- `index.html` → 고도몰 `메인/main/index.html` (또는 `test_260408.php`)
