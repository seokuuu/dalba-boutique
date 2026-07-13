# 달바 프로페셔널(PRO) 몰 구축 — 마스터 개발 문서

> 최종 갱신: 2026-07-03
> 이 파일 하나로 프로젝트 파악 + 개발 착수 + 진행도 확인이 가능하도록 정리한 단일 문서.
> 새 세션에서 작업 시작할 때 **이 파일부터 읽으면 됨.** (관련: `달바프로페셔널_구축기획_260703.md`, `CLAUDE.md`, 견적서 `~/Downloads/달바_프로페셔널_견적서_260703.xlsx`)

---

## 1. 프로젝트 개요
- 달바 시그니처에 이어 **프로페셔널(리페어링 헤어) 라인** 신규 구축.
- **기존 dalba.co.kr(고도몰/NHN커머스5) 몰 내부에 라인 추가** — 별도 폐쇄몰 아님.
- 시그니처와 동일 방식: `main/html.php?htmid=<line>/<page>.html` 스킨 + 헤더 분기.
- 이번엔 **FE + BE(백엔드)까지** 담당.

---

## 2. 요구사항 — 페이지 구성 (전부 신규, 시그니처 구조 재활용)
| 페이지 | 내용 | 성격 |
|---|---|---|
| **메인** | 대문 브랜딩 영상 + 스크롤형(브랜드 소개 / B&A 전후·릴스 / 무드 컷) | B&A는 **정적 배치 기준**(동적·DB연동 시 별도) |
| **Story** | 브랜드 스토리 + 핵심 성분 | 시그니처 재활용 |
| **Product** | 제품 라인업 6종 (일부 Coming Soon) | 기존 goods_view 연동 |
| **Store** | 제휴 헤어샵 리스트 + 지도 | 시그니처 스토어맵(네이버지도) 재활용 |
| **Articles** | 자사 뉴스·기사 + 디자이너 인터뷰 | 고도몰 기본 게시형 |
| **Pro** | 디자이너 전용 (아래 §4) | 신규 핵심 |

---

## 3. 아키텍처 / 확정 사항
### 도메인 / 진입 방식 (확정)
- ❌ **별도 도메인(dalbaprofessional.co.kr) 사용 안 함.** 멀티도메인 연결/주소 마스킹 방식은 불가(NHN 확인).
- ✅ **dalba.co.kr 내 "탭" 방식으로 확정.** 시그니처처럼 GNB/진입점 탭을 추가하고, 클릭 시 프로페셔널 라인(`main/html.php?htmid=professional/...`)으로 진입. 별도 도메인 없음.
- 회원·상품·주문은 같은 몰이라 그대로 공유.

### 데이터/계정
- 회원·상품·주문 **기존 몰과 완전 공유**. **하나의 계정으로 dalba/프로페셔널 양쪽 로그인.**

### Pro (디자이너 전용) 플로우
- 기존 몰 내 **디자이너 전용 회원등급 + 접근 권한 분리**.
- 가입 인증(아윤채 플로우 동일): 원장=**사업자등록증** / 디자이너=**미용사 자격증 + 사업자등록증** 업로드 + **휴대폰 본인인증**.
- 승인: **Pro 전용 영업팀 관리자**가 서류 확인 후 승인/반려 → **디자이너 전용 등급 부여**(기존 '헤어샵 전용 등급' 활용, 수동 부여 프로세스를 Pro몰로 이관).
- 승인 완료 시 가입자 휴대폰 **자동 알림**(SMS/카카오 알림톡).

### 구매 (검토 중 — §7 미확정)
- 포함안: Pro 영역에서 전용등급 전용가 구매·주문.
- 제외안(유력): 프로페셔널은 가입·인증·제휴확인·제품소개까지, **'구매하기' → 기존 dalba.co.kr goods 연결**. 등급 공유라 본몰에서 **전용가 자동 적용**.

---

## 4. 고도몰 확인된 기능 (근거 — 웹/문서 확인 완료)
- **회원 가입 승인제**(가입대기 → 관리자 승인/반려): 기본 지원. 사업자 회원 승인 시스템으로 도매몰/폐쇄몰서 표준.
- **가입폼 서류 파일 업로드**(사업자등록증/자격증): 커스텀 가능.
- **SMS / 카카오 알림톡 자동발송**: 기본 지원. 이벤트별 자동발송 설정(회원 > SMS/알림톡 설정). 조건: 발신번호 사전등록 / 알림톡은 카카오 채널+템플릿 사전승인 / 발송 건당 포인트 / 08:00~21:00.
- **회원 등급별 전용가**: 기본 지원.
- **멀티도메인 연결**: 됨(같은 몰, DB 공유). 단 페이지별 마스킹/매핑 불가.

---

## 5. 개발 방식 (고도몰 커스텀 페이지)
### 구조: BE(컨트롤러) + FE(스킨) 짝
| 구분 | 위치 | 형식 |
|---|---|---|
| BE (컨트롤러) | `module/Controller/Front/...` | PHP |
| FE (스킨/템플릿) | `data/skin/front/dalba2/...` | HTML (safe mode) |
| 연결 | 컨트롤러 `setData('키',값)` → 스킨 `{=키}` 출력 | |

### 페이지 유형
- **(A) 스킨만** (메인·Story·Product·Store·Articles) → `data/skin/front/dalba2/professional/xxx.html` + `main/html.php?htmid=professional/xxx.html` 접속. 컨트롤러 불필요. **대부분 이거.**
- **(B) 컨트롤러+스킨** → `module/Controller/Front/Professional/XxxController.php`(namespace + `extends \Controller\Front\Controller` + `pre()/index()/post()` + `setData()`) + 스킨. `.../professional/xxx.php` 접속. 서버 로직 필요할 때만.
- ⚠️ Pro 회원가입·승인·등급·전용가·알림 = **PHP 아니라 관리자 설정**으로 해결.

### 소스 접근 / 배포
- 고도몰 관리자 **FTP 정보** 또는 우측 상단 **"개발 소스 관리(스테이징)"**.
- 실서버 직접 X → **스테이징에서 작업·테스트 후 배포.**
- safe mode 템플릿: 화이트리스트 PHP 함수만(explode/str_replace/count/json_encode 등) + 고도몰 함수(`dataBanner`, `dataSubCategory`, `includeFile`, `gd_html_goods_image` 등).
- ⚠️ 템플릿 문법(`{= }`, `<!--{ ? }-->`) 훼손 시 화면 터짐 → **자동 포매팅 끄고 수동 편집, `< !--`/`-- >`/JS 개행 grep 검증, 실브라우저 콘솔 확인** (CLAUDE.md).

### 참조 구현체 (재활용 base)
- 시그니처 스킨: `signature/index.html`(GSAP 스크롤), `signature/product.html`, `signature/ignature/routine.html`, `signature/signature/store.html`(네이버지도+store.js).
- `_header.html`의 `gThisDirName == 'signature'` 분기 → `'professional'` 분기 추가.
- 라이브 확인용: `https://dalba.co.kr/main/html.php?htmid=signature/index.html`

---

## 6. 견적 / 일정
- **90시간 / 5,400,000원** (구매 포함 기준, 부가세 없음 단일). 초과분 **시간당 60,000원** 별도 정산.
- 구매 제외 확정 시 **약 80시간 / 4,800,000원**.
- 기간 **약 4~6주**, **8월 중순 오픈 목표**. (디자인 확정본·콘텐츠 전달 시점부터 착수)

---

## 7. 진행도 (Progress)
### ✅ 완료
- 요구사항 파악(기획안 PDF), 견적·일정 합의, 아키텍처 방향 확정
- 고도몰 기능 확인(승인제/알림/등급가/멀티도메인), 개발 방식(BE/FE 구조) 파악
- 도메인 마스킹 불가 확인(NHN)

### 🔄 진행 중 / 대기
- Figma 디자인 **확정 대기** (디스크립션 node 91-9 아직 미확정)
- **구매 포함/제외** 최종 결정 대기
- 회원 데이터 공유 방식 / 기존 승인 프로세스 존재 — 달바 재확인 중

### ⬜ 예정 (개발 태스크)
- [ ] `data/skin/front/dalba2/professional/` 스킨 폴더 세팅(시그니처 복제·개조)
- [ ] `_header.html`에 `professional` 분기 + 진입점 추가
- [ ] 페이지별 퍼블: 메인 / Story / Product / Store / Articles
- [ ] 메인 B&A(전후·릴스) 신규 컴포넌트
- [ ] Pro: 회원등급 신설 + 접근제한 + 가입폼(서류 업로드) + 본인인증 (관리자 설정 중심)
- [ ] 관리자 승인 → 등급 부여 흐름 + 승인 알림(SMS/알림톡) 세팅
- [ ] GNB/진입점에 프로페셔널 **탭** 추가 (별도 도메인 없이 dalba.co.kr 내 진입)
- [ ] 스테이징 테스트 → 실서버 배포

---

## 8. 미해결 / 확인 대기 항목
- [ ] 구매 기능 Pro 포함 vs 제외 (클라)
- [ ] Figma 디자인 확정 (클라)
- [ ] 상품 6종 고도몰 등록 주체 (달바 운영팀 vs 우리)
- [ ] 알림 채널: SMS vs 카카오 알림톡
- [ ] 회원 데이터 공유 방식 최종 확인 (달바)

---

## 9. 참고 링크 / 소스
### Figma (디자인)
- 파일: PROFESSIONAL-WEB, **file key `YOR7rP6vAL8ugyohPCfy3a`**
- 요구사항 프레임 node-id: `60-9`, `60-1217`, `60-1614`, `60-1637`, `60-1639`, `60-1647`, `60-1649`, `60-1651`, `60-1655`, `60-1662`, `60-1664`, `60-1666`, `60-1675`
- 디스크립션(확정 전): `91-9`
- ※ Figma MCP(`mcp__figma__get_design_context` 등)로 조회 가능 — 확정되면 이 문서에 페이지별 스펙 반영 예정.

### 고도몰 개발 문서 (NHN devcenter)
- 사용자 페이지 추가: https://devcenter-help.nhn-commerce.com/guide/tuning-example/add-user-page.md
- 컨트롤러 커스터마이징: https://devcenter-help.nhn-commerce.com/guide/tuning/source-code/controller.md
- 템플릿 커스터마이징: https://devcenter-help.nhn-commerce.com/guide/tuning/source-code/template.md
- 멀티몰 설정: https://manual.godomall5.godomall.com/data/manual_view.php?category=policy__multiMall___mall_config
- SMS/알림톡: https://godomall-help.nhn-commerce.com/faq/admin/member/sms

### 로컬 참조
- 스킨 참조: 레포 내 `signature/*.html`, `_header.html`, `goods_view.html`
- 기획 합의문: `달바프로페셔널_구축기획_260703.md`
- 견적서: `~/Downloads/달바_프로페셔널_견적서_260703.xlsx`
