# 달바 프로페셔널(PRO) 몰 구축 — 마스터 개발 문서

> 최종 갱신: 2026-07-22
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
| **메인** | 대문 브랜딩 영상(루프 2개, 촉박 시 1개 먼저) + 스크롤형(브랜드 소개 / B&A 전후·릴스 / 무드 컷) | B&A는 **정적 배치 기준**(동적·DB연동 시 별도). ⚠️(260722 Figma 확인) **Story는 별도 페이지가 아니라 이 메인 페이지 안의 스크롤 섹션**임 (GNB엔 Story 탭이 있지만 실제로는 앵커/스크롤 이동으로 추정) |
| **Product** | 제품 라인업 6종 (일부 Coming Soon) | 기존 goods_view 연동. (260722 Figma 확인) "로제 프리지아" 라인, 독자성분 **Peptide Exosome™**. 확인된 4종: 리페어링 헤어 퍼퓸 세럼 / 오일 세럼 / 세럼 트리트먼트 / 스칼프 테라피 세럼 샴푸 |
| **Store** | 제휴 헤어샵 리스트 + 지도 | ⚠️(260722 Figma 확인) 시그니처는 캐러셀+지도모달인데 프로페셔널은 **"매장검색" 검색 UI 중심**("검색된 매장은 총 10건입니다") — `store.js` 그대로 재사용 불가, 검색 인터랙션 추가 필요 |
| **Articles** | 자사 뉴스·기사 + 디자이너 인터뷰 | 고도몰 기본 게시형. (260722) 피그마 레이아웃 그대로 퍼블 가능 확인, 운영은 당분간 브랜드마케팅팀 |
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
- (260722 Figma 텍스트 확인, 노드 PRO-PC-kr-01~03-2) 실제 화면 문구 기준 플로우:
  1. 랜딩: "디자이너 회원만 접속이 가능합니다. 회원가입 후 디자이너 인증 시 특별한 혜택을 받으실 수 있습니다." + "회원가입하고 혜택받기" 버튼 + 카카오톡 '달바 아티스트' 채널 안내
  2. 유형 선택: **사업자(원장)** vs **디자이너**
  3. 휴대폰 본인인증 (이름/생년월일/휴대폰/성별 자동입력, 수정 불가)
  4. 정보 입력 (유형별 분기): 사업자(원장) = 사업자등록번호*, 사업자등록증*(업로드), 매장상호명*, 매장전화번호 / 디자이너 = 사업자등록번호, 디자이너자격증*(업로드). 안내문구: "피부/네일/메이크업 미용사 자격증은 가입이 불가능합니다."
  5. 약관 동의: 이용약관 / 개인정보 수집·이용약관 / **"(필수) 살롱·헤어디자이너 거래 동의"**(부티크 기본 가입폼엔 없는 **신규 약관** — 260722 기준 법률자문 확인 중, 전체보기 클릭 시 별도 약관 페이지 이동 필요)
  6. 승인 대기: "pro 회원은 관리자가 확인 후 회원가입이 완료됩니다. 완료 시 가입하신 휴대폰으로 알림이 발송됩니다."

### 기존 가입폼 소스 분석 결과 (260722, `member/join_agreement.php` + `member/join.php` + 위젯 3개 확보 완료)
- 확보한 파일: `join_agreement.php`(1/3 약관동의+본인인증), `join.php`(2/3 정보입력, 3개 위젯 include), `_join_view.html`(기본정보), `_join_view_business.html`(사업자정보), `_join_view_other.html`(부가정보)
- **본인인증은 이미 `join_agreement.php`에 내장**(아이핀/휴대폰 라디오 선택 → 팝업). Figma의 "PRO-03-1 휴대폰 본인인증"은 별도 신규 페이지가 아니라 이 기존 스텝에 흡수될 가능성 높음.
- **⚠️ 파일 업로드 필드 전무 확인** — `_join_view.html`/`_join_view_business.html`/`_join_view_other.html` 어디에도 `type="file"` 없음. `_join_view_other.html`의 관리자 커스텀 확장필드(`joinField.ex`, ex1~ex6)도 SELECT/RADIO/CHECKBOX/TEXT만 지원, FILE 타입 없음. `join.php` `<form>`에 `enctype="multipart/form-data"`도 없음. → **사업자등록증/디자이너자격증 업로드는 관리자 설정 불가, 100% 코드 개발 필요.**
- **⚠️ 3번째 필수 약관 슬롯 없음 확인** — `join_agreement.php`의 필수(`class="require"`) 체크박스는 `termsAgree1`(이용약관)/`termsAgree2`(개인정보) 2개가 단일 객체(`agreementInfo`/`privateApproval`)에 하드코딩. 배열 기반으로 여러 개 넣을 수 있는 `privateApprovalOption`/`privateConsign`/`privateOffer`는 전부 "선택" 취급이라 필수 검증 대상 아님. → **"살롱·헤어디자이너 거래동의"를 필수로 추가하려면 코드로 3번째 하드코딩 블록 필요, 관리자 설정 불가.**
- **🔑 아키텍처 재검토**: `join.php`/`join_agreement.php`는 **dalba.co.kr 전체 공용 가입폼**이라 여기 직접 편집하면 일반 회원가입에도 영향. Figma 시안도 Pro 전용으로 완전히 다른 5단계 디자인. → **"기존 폼에 필드 추가"가 아니라 Pro 전용 신규 컨트롤러+스킨(§5 유형 B)을 새로 만들고, 회원 생성 시점에만 기존 join 로직을 재사용/호출하는 구조가 안전.** 즉 BE 작업량이 애초 "관리자 설정 위주" 예상보다 큼(실제 PHP 컨트롤러 신규 개발 필요).

### 구매 — **제외로 확정** (260722 Figma 기획 메모, 노드 91:9 기준)
- ~~포함안~~: Pro 영역에서 전용등급 전용가 구매·주문 → 채택 안 됨.
- ✅ **채택**: 프로페셔널은 가입·인증·제휴확인·제품소개까지만, **'구매하기' 클릭 시 기존 dalba.co.kr `goods_view.php?goodsNo=...`로 연결**. 독립 구매 기능 자체를 만들지 않음.
  - 사유(기획 메모 원문): "독립 구현 시 DB 재설계, PG사 재연동 필요 → 오류율/비용 상승. 기존 로직에 분기 처리하는 게 가장 안전한 방식"
  - 제휴가 로직: 비로그인 시 정상가, 디자이너/살롱 등급 로그인 시 할인가(제휴가) 노출 → 가격 페이지에서 타겟팅 배너 클릭 시 기존 상세페이지로 연결.
  - → **80시간/4,800,000원 견적이 확정 기준**이 됨 (§6 참조).

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
- 시그니처 스킨: `signature/index.html`, `signature/product.html`, `signature/ignature/routine.html`, `signature/signature/store.html`(네이버지도+store.js).
  - HTML 자체는 `horizontal-scroll`/`carousel`/`video-player` 등 자체 클래스명 기반(비디오 hero + fade-in 텍스트 + horizontal scroll 섹션 + carousel)이지만, **애니메이션 로직은 GSAP 맞음** — `_header.html` L108-119에서 `gThisDirName == 'signature'`일 때 GSAP(ScrollTrigger/Draggable 등) + `signature/common/base.js` + 페이지별 `{gCurrentPageName}.js`를 로드해서 처리. HTML 마크업만 봐서는 GSAP 여부가 안 보이는 구조.
  - 실제 서버 경로는 파일 내부 주석 기준 **`signature/kr/index.php`** — `kr` 서브폴더 존재 (다국어 구조 가능성, `en/` 등도 있을 수 있음). 로컬 레포엔 `signature/index.html`로 단순화되어 있음.
- `_header.html`의 `gThisDirName == 'signature'` 분기 → `'professional'` 분기 추가.
- 라이브 확인용: `https://dalba.co.kr/main/html.php?htmid=signature/index.html`
- (260722 확인) `module/Controller/Front/` 트리에 `Signature` 항목 없음 → 시그니처는 컨트롤러 없는 **순수 스킨(유형 A)** 확정. `.php` 확장자여도 컨트롤러가 꼭 있는 건 아님 (`main/index.php`도 동일 확장자지만 루트 메인이라 유형 분류 대상 아님).

---

## 5-1. 고도몰 관리자 화면 구조 (260722 확인)

두 개의 별개 트리가 있음. 혼동 주의.

| 화면 | 위치/내용 | 대응 서버 경로 | 용도 |
|---|---|---|---|
| **"새로운 페이지 추가"** (좌측 상단 아이콘) | `dalba_main` 트리 — `abc, 게시판, collection, ..., 메인/main, ..., signature/signature, story/story, ...` | `data/skin/front/dalba2/...` | **FE 스킨/템플릿** 관리. 여기서 폴더+페이지 새로 만들면 `htmid=` 접속 가능해짐 |
| **"개발작업소스"** | `data > module > Component / Controller(Admin, Front) / Widget` | `module/Controller/Front/...` | **BE 컨트롤러**(PHP 로직) 관리. 대부분 페이지는 안 건드림 |

- (260722) `module/Controller/Front/`에는 `Goods, Main, Member, Mypage, Order, Share`만 존재. `Signature`, `Professional` 둘 다 없음 → 둘 다 컨트롤러 불필요한 순수 스킨 유형.
- (260722) `dalba_main` 트리 최상위에 `professional` 폴더 **아직 없음** 확인 (`signature, story, subscription, test, wm`은 있음). §7 태스크의 "스킨 폴더 세팅"이 아직 유효함.
- **Hello World 테스트 절차**: "새로운 페이지 추가" 클릭 → `professional` 폴더 생성 → 그 안에 페이지 추가(예: `index.html`) → 마크업 저장 → `https://dalba.co.kr/main/html.php?htmid=professional/index.html` 접속 확인. FTP/소스관리 권한 없이도 이 화면만으로 가능.
- (260722) `메인/main` 폴더 밑에 "쇼핑몰 메인본문"이라는 이름의 파일이 **4개**(`index.html`, `index_0628_bak.html`, `index_test.html`, `test_260408.php`) 존재 — 어느 게 실제 라이브인지 불명확. `CLAUDE.md`는 `test_260408.php`를 현재 작업 파일로 지목하지만, 확실히 하려면 고도몰 관리자 **쇼핑몰 환경설정 > 메인화면 설정**에서 활성 파일 확인 필요 (→ §8 미해결 항목에 추가).
- (260722) 현재 라이브 `main/index.php`(= 로컬 `index.html`) 메인 배너 첫 슬라이드에 이미 "d'Alba PROFESSIONAL RENEWAL" 티저가 들어가 있음. 단, 링크가 `goods_view.php?goodsNo=1000000872`(기존 상품 페이지)로 걸려있어 신규 프로페셔널 라인 사이트(`htmid=professional/*`)와는 무관 — 프로페셔널 라인 완성 후 이 링크 교체 검토 필요.
- (260722) `dalba_main` 트리의 **`abc` 폴더는 테스트/스케치용 샌드박스**로 확정 (실제 프로페셔널 라인 최종 위치 아님). 여기서 먼저 만들어보고 검증한 뒤, 실제 반영은 `professional` 폴더를 새로 만들어 옮기는 방식으로 진행 예정.

---

## 5-2. BE / FE 역할 분담 (260722 초안, 회원가입 소스 분석 반영)

| 구분 | 페이지/기능 | 작업 내용 | 근거/재사용 소스 |
|---|---|---|---|
| FE | 메인 | hero 영상 + fade-in 텍스트 + horizontal-scroll(Story 섹션 포함) | `signature/index.html` 패턴 |
| FE | Product | 상품 그리드(확인된 4종 + 나머지) | `signature/product.html` 패턴 |
| FE | Store | **매장검색 UI 신규**(시그니처의 캐러셀+지도모달과 다름) | `signature/signature/store.html` 골격은 참고만, 검색 인터랙션은 신규 |
| FE | Articles | 게시판형 레이아웃 퍼블 | 고도몰 기본 게시판, 커스텀 최소, 운영은 브랜드마케팅팀 |
| FE | Pro 랜딩 페이지 | 소개 페이지 신규 퍼블 | signature 패턴 재사용 |
| FE | `_header.html` | `gThisDirName=='professional'` 분기 추가 (GNB, GSAP 로드, body class) | 기존 `signature` 분기(L108-119) 복제 |
| **BE (신규 컨트롤러, but 로직 대부분 재사용)** | **Pro 가입 플로우 전체** | 기존 공용 `join.php`/`join_agreement.php`는 **직접 편집하지 않음**(다른 회원가입에 영향 감) — 대신 **Pro 전용 신규 Controller+스킨**(§5 유형 B)을 만들되, **기존 페이지를 참고해서 새로 작성**하는 것이지 로직을 처음부터 새로 설계하는 게 아님. ID/PW 검증·중복체크·약관 저장·회원 insert 등 **핵심 로직은 기존 join 로직과 동일하게 재사용/모방**. 실제로 신규 개발이 필요한 부분은 **딱 2가지**: ① 파일 업로드(사업자등록증/디자이너자격증) 필드+저장 처리, ② 3번째 필수 약관("살롱·헤어디자이너 거래동의") 체크+검증. 그 외(휴대폰 본인인증 연동 등)는 기존 `join_agreement.php` 방식 그대로 | §3 "기존 가입폼 소스 분석 결과" 참조 — 파일 업로드·3번째 필수약관만 관리자 설정 불가로 확정, 나머지는 기존 로직과 동일 |
| BE(관리자 설정) | 회원등급 | 디자이너 전용 등급 신설 | 관리자 화면, 코드 아님 |
| BE(관리자 설정) | 가입 승인제 | on + Pro 전용 승인 관리자 권한 | 관리자 화면 |
| BE(관리자 설정) | 알림 | 승인완료 SMS/카카오 알림톡 자동발송 | 관리자 화면 |
| BE(관리자 설정) | 제휴가 | 등급별 할인가 설정 | 관리자 화면 |
| BE(관리자 설정, 시도) | 약관 텍스트 등록 | 이용약관/개인정보약관은 기존 항목 그대로, "살롱·헤어디자이너 거래동의"는 **내용 등록은 관리자에서 가능해도 "필수" 체크박스 자체는 코드로 추가해야 노출됨**(위 표 참조) | `service/agreement.php?code=` 패턴 재사용 가능 |

→ 결론(260723 확정): FE는 시그니처 참고해 새로 작성하는 정도로 가볍고, BE도 **"관리자 설정 위주"** 최초 가정과 완전히 달라진 건 아님 — 기존 가입 로직을 그대로 재사용/모방하되, **파일 업로드 처리 + 3번째 필수 약관 검증, 이 2가지만 순수 신규 개발**로 확정. 다만 이 2가지가 컨트롤러 레벨(PHP) 작업이라 "관리자 화면 클릭"으로 끝나는 다른 항목들과는 성격이 다르므로, 견적(§6, 80h 기준)에 이만큼의 컨트롤러 개발 시간이 포함돼있는지는 확인해두는 게 안전.

---

## 6. 견적 / 일정
- **90시간 / 5,400,000원** (구매 포함 기준, 부가세 없음 단일). 초과분 **시간당 60,000원** 별도 정산.
- ✅ 구매 **제외 확정**(§3 참조) → **약 80시간 / 4,800,000원**이 적용 견적.
- 기간 **약 4~6주**, 오픈 목표 **8월 중순 → 8/14로 구체화**(260722 Figma 기획 메모 기준). (디자인 확정본·콘텐츠 전달 시점부터 착수, 기존 견적/일정 틀 자체는 변동 없음)

---

## 7. 진행도 (Progress)
### ✅ 완료
- 요구사항 파악(기획안 PDF), 견적·일정 합의, 아키텍처 방향 확정
- 고도몰 기능 확인(승인제/알림/등급가/멀티도메인), 개발 방식(BE/FE 구조) 파악
- 도메인 마스킹 불가 확인(NHN)
- (260722) 관리자 화면 구조 실사 — "새로운 페이지 추가"(FE 스킨 트리) vs "개발작업소스"(BE 컨트롤러 트리) 구분 확인, 상세는 §5-1 참조
- (260722) `professional` 폴더 미생성 상태 재확인 (스킨/컨트롤러 양쪽 다 없음)
- (260722) 시그니처 컨트롤러 없음(순수 스킨) 확인, 실제 서버 경로 `signature/kr/index.php` 확인
- (260722) **Figma Dev Mode MCP 연결 완료** (`http://127.0.0.1:3845/mcp`), 파일 `YOR7rP6vAL8ugyohPCfy3a` 노드 60:9(전체 시안) + 91:9(기획팀 결정 메모) 직접 조회
- (260722) **구매 포함/제외 → 제외로 확정** 확인 (기획팀 메모 원문 근거, §3 참조)
- (260722) Pro 가입 플로우 실제 화면 문구로 확인 (§3 참조), Story가 Main 내 스크롤 섹션임을 확인, Product 4종 실명 확인, Store가 검색 UI 기반임을 확인
- (260722) "abc" 폴더는 **테스트/스케치용 샌드박스**로 확정 (실제 최종 반영은 `professional` 폴더에 별도 진행)

### 🔄 진행 중 / 대기
- Figma 프레임 다수가 초안 반복본으로 보임(예: MAIN-03-1~4) → **어떤 넘버가 최종 확정본인지 디자인팀 확인 필요**
- Pro 약관 3종 중 "살롱·헤어디자이너 거래 동의" **법률자문 확인 중**
- 회원 데이터 공유 방식 / 기존 승인 프로세스 존재 — 달바 재확인 중

### ⬜ 예정 (개발 태스크)
- [x] 페이지별 초안 퍼블 (Pro 제외): **메인 / Product / Store / Articles** — 로컬 `professional/main.html`, `product.html`, `store.html`, `articles.html`로 초안 작성 완료 (260723). 시그니처 패턴 참고, 확인된 실제 카피(§2/§3) 반영, 미확정 자산/데이터는 TODO 주석으로 표시. **아직 abc 샌드박스에 업로드 전 — 로컬 초안 단계.**
- [ ] `data/skin/front/dalba2/abc/`(샌드박스)에 위 4개 파일 업로드 후 브라우저 확인 → 문제 없으면 `professional/` 폴더로 정식 이관
- [ ] `_header.html`에 `professional`(또는 abc) 분기 + 진입점 추가 — 아직 미착수
- [ ] 메인 B&A(전후·릴스) 신규 컴포넌트 — Figma 최종 프레임 확정 후 착수 (현재 main.html에 TODO로 표시만 해둠)
- [ ] Pro: 신규 컨트롤러+스킨(§5-2 참조) — BE 작업, 오늘 범위 아님(사용자 지시로 보류)
- [ ] 관리자 승인 → 등급 부여 흐름 + 승인 알림(SMS/알림톡) 세팅
- [ ] GNB/진입점에 프로페셔널 **탭** 추가 (별도 도메인 없이 dalba.co.kr 내 진입)
- [ ] 스테이징 테스트 → 실서버 배포

---

## 8. 미해결 / 확인 대기 항목
- [x] ~~구매 기능 Pro 포함 vs 제외~~ → **제외로 확정** (260722, §3)
- [ ] Figma 프레임 다수가 번호별 초안 반복본 — **최종 확정 넘버링** 디자인팀 확인 필요 (260722)
- [ ] 상품 6종 고도몰 등록 주체 (달바 운영팀 vs 우리) — 4종 실명은 확인됐으나 등록 주체는 미정
- [ ] 알림 채널: SMS vs 카카오 알림톡
- [ ] 회원 데이터 공유 방식 최종 확인 (달바)
- [ ] (260722 추가) `메인/main`의 `index.html` / `index_0628_bak.html` / `index_test.html` / `test_260408.php` 중 실제 라이브로 지정된 파일이 무엇인지 관리자 메인화면 설정에서 확인 필요
- [x] ~~회원가입/로그인 관련 템플릿 소스가 로컬에 없음~~ → **확보 완료** (260722, `join_agreement.php`/`join.php`/위젯 3개, §3 참조). 결과: 파일 업로드·3번째 필수 약관 둘 다 코드 개발 필요로 확정, Pro 전용 신규 컨트롤러+스킨 방향으로 아키텍처 재검토 필요
- [ ] (260722 추가) Pro 약관 "살롱·헤어디자이너 거래 동의" 법률자문 확정 대기
- [ ] (260722 추가) Store/Articles 데이터를 "당분간 브랜드마케팅팀이 관리자 페이지에서 운영"하기로 했는데, 이게 개발 범위에서 완전히 빠지는지 확정 필요

---

## 9. 참고 링크 / 소스
### Figma (디자인) — (260722 MCP 연결 완료, 아래 내용 실제 조회함)
- 파일: PROFESSIONAL-WEB, **file key `YOR7rP6vAL8ugyohPCfy3a`**
- 전체 시안: `60:9` ("260703-시안전달용" 섹션). 프레임 인벤토리(대부분 `-PC-kr-` 네이밍, 번호 여러 개는 초안 반복본 추정):
  - `MAIN-PC-kr-01, -menu, -02-1, -03-1~4, -04, -05`
  - `PRODUCT-PC-kr-01, -01-2(회원전용), -01-3(마우스오버), -02, -03, -04`
  - `STORE-PC-kr-01`, `ARTICLES-PC-kr-01`
  - `PRO-PC-kr-01, -02, -03-1, -03-2`
- **기획팀 결정 메모**: `91:9` ("Description" 섹션) — §3/§2에 이미 반영한 구매 로직·일정·Store/Articles 운영주체 등 확정 사항이 여기 정리돼있음. 상태 범례: 🔴확인중 / 🟢확정 / 🟡보류.
- 메모 안에 소스경로 링크 발견: `https://works.do/F67LzPY` (별도 자료 — 미확인, 필요 시 열어볼 것)
- MCP 사용법: `mcp__figma__get_metadata`(구조 개요, nodeId 없이 호출하면 최상위 페이지 목록) → `mcp__figma__get_design_context`(실제 코드+스크린샷, 구현 단계에서 사용) → `mcp__figma__get_screenshot`(시각 확인만 필요할 때). 노드 60:9 전체를 한 번에 get_metadata 하면 21만자 넘어가 결과가 파일로 저장되니, 필요한 하위 프레임 id로 좁혀서 조회할 것.

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
