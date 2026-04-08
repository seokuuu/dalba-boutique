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
