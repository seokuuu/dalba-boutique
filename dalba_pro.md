# 달바 프로페셔널(PRO) 몰 구축 — 마스터 개발 문서

> 최종 갱신: 2026-08-05
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

### 🎯 축2 회원/가입 최종 확정 (260729 — 고도몰 2차 답변 + 담당자 협의)
> 상세: `professional/webftp/member/README-pro-join.md` §"축2 최종 아키텍처 확정". 아래는 요약. (이 결정이 §3의 이전 Pro 플로우 초안보다 우선)
- **회원가입 = 달바 일반 회원가입으로 통합** (기존 로직 그대로, 커스텀 가입 개발 0). 누구나 일반회원.
- **Pro 판별 = 회원등급 `gMemberInfo.groupNm == '프로페셔널'` 단일 기준.** (회원구분 아님)
  - 이유: ① **이미 다른 사업자 회원 존재** → 회원구분=사업자 게이트면 무관한 사업자도 열림 ② 제휴가가 등급 기준(등급은 1인 1개) ③ 회원구분(`memberFl`)은 로그인 전역 객체 `gMemberInfo`에 없음(게이트 불가), 등급은 있음(확실).
- **Pro 신청 = 로그인 회원이 별도 게시판(비밀글+파일첨부)에 사업자/디자이너 등록증 업로드 → 관리자 승인 = "프로페셔널" 등급 부여** (+ SMS/알림톡 네이티브). 신규·기존 동일 흐름.
- **제품/가격 = 상품·카테고리 등급 접근제한 + 등급 제휴가**(고도몰 네이티브). 페이지 접근제한은 네이티브 없어 **스킨에서 등급 게이트 자체 구현**(index/product/store/articles 상단, pro.html 제외).
- **개발 범위**: 로그인 ✅완료(pro.js) / PRO 신청 게시판 ⬜ / 등급 게이트 ⬜ / 관리자 세팅(등급·제휴가·알림) ⬜. **불필요**: 커스텀 가입·comCertification 이식·개인→사업자 전환(네이티브 미지원)·5단계 가입 스킨.
- 미결: 사업자번호 중복확인=승인 시 관리자 수동(추천) or 게시판 커스텀 / `gMemberInfo` pro페이지 전역노출=업로드 후 실테스트 / 등급명 "프로페셔널" 고정 운영.

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
- **🔁 파일 업로드 결론 수정 (260727, `member_joinitem.php` 실소스 확인 — 기존 "100% 코드 개발" 은 과대평가였음)**
  - 프론트 위젯(`_join_view_other.html`)의 커스텀 확장필드(`joinField.ex`, ex1~ex6)는 SELECT/RADIO/CHECKBOX/TEXT만 지원(FILE 없음) — 이건 맞음. **하지만 이게 파일업로드의 유일한 경로가 아니었음.**
  - **고도몰 기본 기능으로 파일첨부가 별도로 존재** (`member_joinitem.php` 사업자정보 섹션 L354~):
    - `comCertification[use/require]` = **사업자등록증** 첨부(사용/필수/용량 관리자 설정)
    - `comAddiCert[N][name/use/require]` = **추가 첨부 항목**(항목명 관리자 지정, 추가/삭제) → **"디자이너 자격증"을 여기서 생성 가능**
  - 다만 현재 프론트 스킨 `_join_view_business.html`엔 이 파일필드 **렌더링 마크업이 빠져있음**(상호/사번/대표자/업태/종목/주소만). `join.html` L15 `<form>`에 `enctype="multipart/form-data"`도 없음.
  - → **결론: "순수 신규 개발"이 아니라 ① 관리자에서 comCertification/comAddiCert 켜기 + ② 프론트 스킨에 고도몰 원본 파일필드 마크업 이식 + ③ form enctype 추가 수준.** 착수 전 **고도몰 원본소스 `_join_view_business.html`**(원본소스 보기) 확보해 원본에 렌더 파트가 있는지만 확인하면 됨.
- **🔁 3번째 필수약관 결론 수정 (260727, `join_agreement.html` 실소스 확인)** — 필수 검증은 **`class="require"` 기반**(L243 `$(':checkbox.require').each(...)`). 기존 필수는 `termsAgree1`(이용약관)/`termsAgree2`(개인정보)만 `class="require"`, 추가약관(3/4/5)은 전부 선택. → **"살롱·헤어디자이너 거래동의" 체크박스에 `class="require"`+name만 붙이면 프론트 필수검증 자동 적용.** 백엔드 저장 필요 여부(법적)만 확정하면 됨(불필요 시 프론트만). "컨트롤러 신규 하드코딩 블록 필요"는 과대평가였음.
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

> ⚠️ 위 "딱 2가지 순수 신규 개발" 은 **260727 실소스 확인으로 더 가벼워짐** — §3 "🔁 파일업로드/3번째약관 결론 수정" 참조. 파일업로드는 고도몰 기본기능(comCertification/comAddiCert)이 있어 **원본 마크업 이식 수준**, 3번째 약관은 **`class="require"` 추가 수준**.

---

## 5-3. 로컬 스킨/구조 생성 현황 (260727)

**실제 스킨 경로는 `data/skin/front/dalba_main/`** (문서 곳곳의 `dalba2`는 오기 — WebFTP `Home data skin front dalba_main` 로 확정). CLAUDE.md 상단 폴더구조도 `dalba_main` 기준이 맞음.

**스킨 인프라 확정 (260729, 사용자 확인):**
- **모바일 = `dalba_main` 반응형** — 별도 모바일(moment) 버전 불필요. professional CSS 미디어쿼리로 커버.
- **페이지 등록 = FTP 업로드만으로 `htmid=professional/*.html` 접속됨** (관리자 별도 등록 절차 없음).
- **`common.css`는 시그니처에 실제로 없음**(헤더가 부르지만 404, 무해). professional은 재구성본(tokens+reset+base) 제공 → 404도 없고 문제없음. 공통 스타일은 professional.css(=signature.css 클론)+base/reset/tokens+페이지CSS에 다 있음.
- **푸터 = 요구프레임 1번 "로고만 교체, 시그니처와 동일" 확정** (260729 사용자 재확인. 이전 "커스텀 ②" 기록은 오정정 → 폐기). → `outline/footer/standard.html`에서 footer_pro 커스텀 분기 제거, footer_logo만 `gThisDirName=='professional'`일 때 professional 로고로 스왑하고 footer_content(Customer Care/Order/Legal/Social+주소)는 공용 공유. professional.css의 footer_pro CSS도 제거(→ `.footer-professional-logo` 사이징만 유지).

로컬 레포 `professional/` 밑에 **업로드 목적지별 2트리**로 파일 구성 완료 (`professional/webftp/` = 스킨 FTP, `professional/admin/` = 관리자소스):

```
professional/
├── webftp/                         # → data/skin/front/dalba_main/ 로 업로드
│   ├── professional/               # 스킨 HTML (htmid=professional/*.html)
│   │   ├── index.html  (기존 main.html 리네임)
│   │   ├── product.html / store.html / articles.html
│   │   └── pro.html    (신규: Pro 랜딩/접근게이트)
│   ├── css/professional/           # signature CSS 복제·개조
│   │   ├── professional.css (=구 signature.css) / index / product / store / articles / pro
│   │   └── common/ {common(재구성), base, reset, tokens, store}.css
│   ├── js/professional/            # signature JS 복제, 네임스페이스 window.professional
│   │   ├── common/base.js  index.js  store.js(검색UI 신규)
│   ├── member/                     # 축2 Pro 가입 스킨 base + README-pro-join.md
│   └── outline/_header.html        # professional 분기 추가본
└── admin/member/                   # member_joinitem.php(참고) + README-admin-config.md
```

- **축1(마케팅 스킨) = 실동작 코드 생성 완료.** `main.html`(hero/fade-in/horizontal-scroll) 클래스가 index.js 셀렉터와 일치 → 그대로 애니메이션 동작. store는 캐러셀 대신 **검색 UI + 지도모달**로 새로 작성(store.js).
- **`_header.html`**: signature 블록(그대로) + **professional 전용 블록 신규**(CDN preconnect 제외, GSAP+common.css+base.js+page.js). body class에 `body-professional` else-if 추가. 템플릿 문법 검증(`< !--`/`-- >`/블록 균형) 통과.
- **축2(가입) = 스테이징 + 개조 가이드**만. 실제 구현은 고도몰 원본소스 `_join_view_business.html` 확보 + BE 컨트롤러 필요 → `professional/webftp/member/README-pro-join.md` 에 라인단위로 정리.
- ⚠️ **미확보 파일**: `css/signature/common/common.css` 가 다운로드에 빠져 `professional/webftp/css/professional/common/common.css` 를 tokens+reset+base 번들로 **임시 재구성**함. 원본 받으면 교체 필요.

### 남은 업로드/검증 (다음 단계)
- [ ] webftp 트리를 `data/skin/front/dalba_main/` 해당 위치에 업로드 → `html.php?htmid=professional/index.html` 접속, Network/Console 확인
- [ ] `professional` 스킨 폴더가 dalba_main 트리에 아직 없음 → "새로운 페이지 추가"로 생성 후 업로드
- [ ] 로제 프리지아 포인트 컬러 확정 시 `tokens.css --color-primary` 교체
- [ ] 고도몰 원본소스 `_join_view_business.html` 확보 (축2 파일필드 이식용)

---

## 5-5. Figma 시안 실제 확인 (260727, MCP로 5개 페이지 조회)

파일 `YOR7rP6vAL8ugyohPCfy3a`, 섹션 60:9. **페이지별 프레임 node id + 현재 빌드와의 차이**:

| 페이지 | node id | 시안 내용 | 내 빌드와 차이 |
|---|---|---|---|
| **메인** | `60:10`(01), `60:1217`(02), `60:115/183/614/659`(03-1~4), `60:1453`(04), `60:129`(05) | 검정 배경 + **제품컷 히어로**(R02 Rose Freesia) + 스크롤 섹션. GNB=**Prata 서체**, Story/Product/Store/Articles/PRO | 히어로 video→**제품 이미지**, GNB 폰트 Prata, 스크롤 섹션 02~05 자산 필요 |
| **프로덕트** | `60:225`(01) | 핑크 제품컷 풀블리드 + 우측 텍스트 "d'Alba PROFESSIONAL / **헤어도 스킨케어처럼 관리하는 엔젤링 라인**" | 카피 다름(**엔젤링/로제 엔젤링** — 기존 "Peptide Exosome™/로제 프리지아"와 상이, 확인 필요), 히어로 구조 |
| **스토어** | `60:371`(01) | ⚠️ **왼쪽 검색리스트 + 오른쪽 상시 지도(전체 매장 마커)** 스플릿 뷰. 리스트 아이템=이름+주소+전화+`>`, 선택 시 지도 하이라이트. **모달 아님** | 내 빌드는 "리스트+[지도에서보기] 모달" → **스플릿 뷰로 재작업 필요**(지도 상시노출, 전 매장 마커) |
| **아티클** | `60:278`(01) | "Articles" + **카테고리 탭(NEWS/EVENT/COLLABORATION)** + 3열 카드(이미지/카테고리/제목/날짜) | 거의 일치, **카테고리 탭만 추가** |
| **프로** | `60:739`(01-1), `60:788`(01-2), `228:42`(02-1), `60:920`(03-1), `60:1063`(03-2) | 핑크 배경 + 중앙 카드: **왼쪽 Login(아이디/비번/로그인) + 오른쪽 New Account Inquiry**(디자이너 안내+카카오 '달바 아티스트'+[회원가입하고 혜택받기]) | 내 pro.html은 단순 게이트 → **로그인+가입안내 스플릿 카드로 재작업** |

**공통**: GNB **Prata** 서체, 푸터 = **시그니처 푸터와 동일(로고만 professional 교체)** ← 260729 확정(요구프레임 60:1662). Variables 미사용(get_variable_defs={}) → 색은 원시값/사진.
**⚠️ 자산**: 히어로/제품 사진·영상은 전부 raster → 코드로 못 만듦, 팀 export 필요. MCP는 **활성 Figma 탭의 파일만** 읽음(탭 바뀌면 노드 안 잡힘).

### 구현 반영 (260727)
사용자가 `professional/-레퍼런스 소스(이미지,영상)/` 로 참고 자산 제공(bg-01~05, 무드컷, 909f9e=Tiny Wonder 프로덕트컷, MAIN-SECTION1-PC.mp4). **44MB 영상은 비트레이트 15.5Mbps로 과함 → 미사용(추후 압축본 제공 예정), 이미지로 대체.** Olaplex(bg-04)·타사 무드컷은 라이브 미사용(무드 참고).
- 자산 배치: `webftp/data/img/professional/{main,product,pro}/` (사용가능 d'Alba 컷만)
- **메인**: 히어로 `<video>`→`<picture>` 이미지 교체(영상 오면 복원)
- **프로덕트**: 히어로 Tiny Wonder 이미지 + 카피 Figma 문구("헤어도 스킨케어처럼 관리하는 엔젤링 라인")로 교체. ⚠️ 기존 md "로제 프리지아/Peptide Exosome™"와 상이 → 최종 카피 확정 필요
- **아티클**: 카테고리 탭(NEWS/EVENT/COLLABORATION) + 필터 JS 추가(게시판 말머리 연동 대비)
- **스토어**: 모달 → **스플릿뷰**(왼쪽 검색리스트 + 오른쪽 상시 지도, 전 매장 마커, 리스트 클릭 시 하이라이트/이동) 재작업. store.js 전면 개편(전 매장 좌표 확보 후 마커, 검색 시 리스트+마커 필터)
- **프로**: 게이트 → **로그인 + New Account Inquiry 카드**(핑크 배경) 재작업. 로그인 폼 action은 고도몰 member/login.php 기준 placeholder(연동 확인 필요)
- (260728) 사용자 추가 자산: `professional/제품 누끼/`(누끼 7종), `달바-헤어-프로페셔널-로고...png`(검정,투명 6500px), `professional/약관 자료/`(이용약관.docx, **거래동의 약관_260716.docx**=축2 3번째 필수약관)
  - **반영**: Prata 서체 적용 / 히어로 로고 이미지 교체(검정+그림자, 최종 어두운 히어로 시 `hero__logo--white`) / **제품 누끼 4종** → `data/img/professional/{product,index}/` 배치(퍼퓸100·오일·트리트먼트180·샴푸275ml, 1400px 리사이즈) / 로고 → `common/professional-logo.png`
  - (260728) **전용 GNB + 전용 푸터 반영**: `outline/header/standard.html`에 `gThisDirName=='professional'` nav 분기(Story/Product/Store/Articles/PRO)+전용 로고, `outline/footer/standard.html`에 professional 푸터 분기(로고+달바글로벌+Contact 비즈니스 이메일). 둘 다 additive(부티크/시그니처 무영향), 푸터 핵심 스크립트(section theme 색전환) 보존. CSS는 professional.css(professional 페이지에서만 로드→스코프 안전).
  - (260728) **아티클 게시판 연동**: `js/professional/articles.js` 신규 — 아티클 게시판(bdId=`article`) `/board/list.php` AJAX fetch → 카드 렌더(제목/말머리=카테고리/날짜/대표이미지) + 탭(NEWS/EVENT/COLLABORATION) 필터. store와 동일 패턴(gd_btn_view sno 파싱). 운영: 말머리를 NEWS/EVENT/COLLABORATION로 등록. **아티클 게시판 생성 필요(id=article).**
  - (260729) **푸터 정정**: 요구프레임 1번("로고만 교체, 시그니처와 동일")으로 확정 → footer_pro 커스텀 분기 제거, footer_logo만 professional 로고 스왑 + footer_content 공용 공유. professional.css의 footer_pro CSS 제거(`.footer-professional-logo` 사이징만).
  - (260729) **축1 마감 정리**: 무드컷 갤러리 캐러셀 추가(MOOD-01~06), discover(라인업)/product Coming Soon 숨김(범위 제외), Store 핀 스타일(회색 기본/검정+확대 선택), GNB Story 2뎁스 서브메뉴+메인 앵커 스무스 스크롤(#brand-story/#ingredient, index.js `initSectionAnchorScroll`).

### 축1 남은것 (자산/확정 대기 — 코드로 더 못 나감, 260729 기준)
1. **성분소개 POINT 01~04** — horizontal-scroll STEP 3→4개 확장 + 엔젤링 성분 최종 카피 확정 후
2. **Product 썸네일 hover 이미지 전환** — 제품별 2번째 컷 자산 필요(60:1664)
3. **인물아바타 영상롤링 섹션** — 60:1647, 자산 7월말
4. **히어로 영상** — 5MB권장·mp4·2개(세로 8/14, 가로 8/21)·모바일별도(91:9). 현재 `<picture>` 이미지 대체 중
5. **브랜드스토리 심볼 루프 애니메이션** — 심볼 자산(60:1614)
6. **제휴가 로직** — 로그인 등급별 정상가/할인가 + 디자이너 타겟팅 배너(91:9 3-2/3-3), 등급 설정(축2 연계)
7. **goodsNo** — 상품 6종 고도몰 등록 후 product.html `goodsNo=` 링크 반영
8. Product 카드 용량/가격(제휴가 확정 후) / 바탕 `#FAFAFB` 확인 / 흰색 로고(현재 CSS invert 대응)

---

## 5-4. Store 매장 리스트 = 고도몰 게시판 연동 (260727 결정·구현)

운영팀 자가관리 요구 → signature식 하드코딩 대신 **매장 전용 게시판 + 커스텀 스킨 + 프론트 지오코딩**으로 구현.
(라이브 `signature/store.html` 확인: 매장은 store.js 하드코딩 배열을 JS가 렌더 = 게시판 아님. signature는 지도/모달 참고용일 뿐 자가관리 지름길 아님.)

### ⚠️ 고도몰 board 소스 3종 확인 결과 (260727, 실소스)
- `list.html`(목록): 루프 `bdList.list`, 필드 `.sno/.subject/.category(말머리)/.viewListImage/.regDate/.writer` — **본문 없음**
- `_board_article.html`(리스트 위젯): `.sno/.subject/.isNew`만 — **본문 없음**
- `view.html`(상세): **본문 = `bdView.data.workedContents`** (`.seem_cont` 안에 렌더) — 본문은 여기만 있음
- → **목록/위젯 어디에도 주소·전화(본문)가 안 실림.** 그래서 "지도 클릭 시 상세(view)를 fetch 해 본문 파싱" 방식으로 확정.

### 동작 흐름 (최종)
매장 게시판 위젯(`_board_article_store.html`)이 `#storeList`에 `<li data-name data-view-url>` 렌더 → `store.js`가 이름/검색 처리. **"지도에서 보기" 클릭 → `data-view-url`(view.php) fetch → 본문 `.seem_cont`에서 라벨 파싱 → 좌표(`data-lat/lng` 우선, 없으면 주소 지오코딩) → 지도모달.** (본문/좌표가 목록에 실려오면 fetch 없이 즉시 사용)

### 게시판 설정 (관리자)
- 유형 **갤러리형**, 쓰기권한 **관리자 전용** / 리스트·읽기 전체.
- **에디터 "사용안함" 권장**(본문 평문화 → 라벨 파싱 안정), **기본 게시글 양식**에 입력 틀 등록.
- store 페이지는 위젯 include 방식이라 게시판 자체 스킨은 기본값으로 둬도 됨(위젯 스킨만 커스텀).

### 데이터 계약 (매장 1개 = 게시글 1개)
- 매장명 = **제목** / (선택)지역 = **말머리(category)** / 사진 = **대표이미지**
- 본문(평문 라벨): `주소:` / `전화:`(또는 전화번호/연락처) / `영업시간:`(세그먼트 `;` 구분) / (선택)`좌표: 37.5,127.0`
- store.js: `data-*` → `.store_data_raw`/`data-content` → **상세 view fetch** 순으로 보충. 검색은 이름+지역+주소.

### 생성 파일 (로컬)
- `professional/webftp/js/professional/store.js` — DOM 파싱 + **상세 view fetch(fetchStoreDetail)** + 지오코딩 + 검색 (하드코딩 제거)
- `professional/webftp/professional/store.html` — maps.js `&submodules=geocoder`, `#storeList`에 위젯 include 문법 + data-* 계약 샘플(테스트용)
- `professional/webftp/board/_board_article_store.html` — **매장 리스트 위젯 커스텀 스킨**(`<li data-name data-view-url ...>`, `<ul>` 래퍼 없음)

### 착수 blocker (board 소스는 확인 완료 — 남은 것)
- [x] ~~`includeWidget(..., [...])`~~ → **불가 확정(260727 라이브)**: 고도몰 `includeWidget`은 인자 1개(경로)만 받음. 파라미터 배열(`['bdId'=>..]`) 넣으니 파싱 실패 → 태그가 **리터럴 텍스트로 노출**됨. **해결: includeWidget 폐기 → store.js가 `/board/list.php?bdId=salon`을 AJAX fetch해 `tr[data-sno]` 파싱으로 목록 렌더**(그 후 각 view fetch로 주소→지오코딩→마커). `_board_article_store.html`은 미사용(참고용 잔존). 동일 패턴으로 Articles도 게시판+AJAX 예정.
- [ ] 네이버 `ncpKeyId` **Geocoding API 사용 신청** 여부 확인
- [ ] 매장 게시판 신설 후 `bdId` 를 store.html include 파라미터에 기입
- [ ] (동일 패턴) Articles 게시판형도 후속 시 재사용 가능

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
- [x] ~~회원가입/로그인 관련 템플릿 소스가 로컬에 없음~~ → **확보 완료** (260722~260727: `join_agreement.html`/`join.html`/위젯 3종/`gd_member2.js`/`member_joinitem.php`, §3 참조). **결론 수정(260727)**: 파일업로드는 고도몰 기본기능(comCertification/comAddiCert) 존재 → 원본 마크업 이식 수준, 3번째 약관은 `class="require"` 추가 수준. "둘 다 순수 코드 개발"은 과대평가였음.
- [ ] (260727 추가) **고도몰 원본소스 `_join_view_business.html`** 확보 — 현재 dalba 스킨엔 파일필드 렌더 마크업이 없어, 원본에 comCertification/comAddiCert 렌더 파트가 있는지 확인 후 이식
- [ ] (260727 추가) **`css/signature/common/common.css`** 확보 — 다운로드 누락분. professional common.css 를 임시 재구성해둠(§5-3), 원본 받으면 교체
- [x] ~~Pro 약관 "살롱·헤어디자이너 거래 동의" 법률자문 대기~~ → **문서 확보(260728)**: `professional/약관 자료/달바프로페셔널 헤어샵 및 아티스트 거래 동의 약관_260716.docx` (+ 이용약관.docx). 축2 3번째 필수약관 본문으로 사용. (백엔드 저장 필요 여부만 확정하면 됨)
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

---

## 10. 작업 로그 — 축2 신청흐름 완성 + 진위/중복 자동화 (260803~260805, PHP만 배포 대기)

> **260805 요약**: WebFTP로 올릴 스킨 파일(verify.js/html/css·pro.css·footer)은 **전부 업로드 완료**. 남은 건 **`ProVerifyController.php`(PHP) 배포 1건**뿐이며, 이는 **웹앤모바일 PHP 8.2 업그레이드 종료 후**로 대기 중(사유 §C). 배포 경로는 규명 완료(=관리자 SFTP, §C/§E).

### A. 완료 (작동 검증됨)
- **축2 신청 흐름 확정·구현**: 회원가입은 달바 일반가입으로 **일원화**(별도 pro 가입 없음) → 로그인 회원이 **인증 신청(서류 업로드)** → 관리자 서류확인 → **"프로페셔널" 등급 부여**. (등급 단일축, 상세는 §3, `member/README-pro-join.md`)
- **pro.html**: 로그인 상태별 버튼(비로그인=로그인/회원가입 · 비프로=인증신청 · 프로=index 자동진입) + 회원가입 복귀 시 인증모달 자동(sessionStorage `proApplyIntent` + join_ok.html 조건복귀).
- **verify.html** (인증 신청폼, Figma 334-73): 사업자(원장)/디자이너 탭, 매장정보, 서류 업로드, 거래동의. 제출 성공 시 게시판 안 가고 **완료 패널** 표시.
- **파일 업로드 = 고도몰 2단계 방식**(verify.js): 파일선택 → `board_ps.php?mode=ajaxUpload`에 **`uploadFile` 필드**로 임시업로드 → `saveFileNm`(temp URL) → write 시 `uploadType=ajax` + `uploadFileNm[N]`/`saveFileNm[N]` 전송. **실제 이미지 업로드 확인**(filesData 2개).
- **proapply 게시판**(관리자 생성): 1:1문의형, **무조건 비밀글**, 파일첨부(10MB), 말머리 `사업자(원장)`/`디자이너`, **자동등록방지 OFF**(안 끄면 제출 거부).
- **게이트 정리**: 다른 탭(index/store/articles/product) **게이트 제거 → 공개**. Product는 **회원전용가**(등급별 가격, 상세 goods_view에서 노출). PRO 메뉴만 pro.html 진입.
- **푸터**: 기존 달바 푸터 그대로 + **우측 로고만 professional**(Figma 310-11). `footer_logo`에서 gThisDirName 분기.
- CSS 크기 축소(pro/verify ~15%), verify width는 `wrapper` 클래스 제거로 해결.

### B. 진위확인 + 중복확인 자동화 (코드 완성 · **배포 보류**)
- **진위확인** = 국세청 상태조회 API (`api.odcloud.kr/.../v1/status`, 공공데이터포털 무료·1일100만건). 사업자번호만으로 계속/휴업/폐업/미등록. **키 발급+실호출 검증 완료**(계속사업자 반환). ⚠️ **일반 인증키(Encoding)** 그대로 사용, 추가 urlencode 금지.
- **중복확인** = 고도몰 Open API `Board_List.php`(`openhub.godo.co.kr`). `partner_key`+`key`, `bdId=proapply&searchField=subject_contents&searchWord=사업자번호` → 응답 XML `<total>`>0 = 중복. **키 발급+실호출 검증 완료**(사업자번호 검색 total=1 매칭, 비밀글도 본사키로 조회됨).
- **컨트롤러**: `professional/php/ProVerifyController.php` — **Front 컨트롤러(같은 도메인)**, 국세청 진위 + proapply 중복 → JSON. 로그인 회원만. 수동 JSON 출력.
  - 배치: `data/module/Controller/Front/Professional/ProVerifyController.php`
  - URL: `https://www.dalba.co.kr/professional/pro_verify.php`
- **서버리스 대안**: `professional/serverless/pro-verify.js` (동일 로직, Vercel 등 외부배포용, CORS 포함).
- **verify.js 토글** `VERIFY_API_URL`: 비면 국세청 직접(진위만), 채우면 진위+중복 통합.

### C. PHP 배포 경로 규명 + 현재 블로커 (260805 갱신)

**PHP 배포 방법 = 관리자 SFTP 직접 접속 (규명 완료).**
- **WebFTP(관리자 스킨 위젯) = img/css/js/html만, PHP 업로드 어디서든 거부** ("이미지 혹은 스타일시트, 스크립트, HTML 파일만 업로드하실 수 있습니다"). data/module 경로로 가도 동일하게 막힘.
- **개발소스관리(원본/개발작업/운영소스 보기) = "새 파일/폴더 추가" 버튼 없음.** '복사하기'는 **기존 원본만** 복제 → 원본에 없는 신규 파일 생성 불가. (= 기존 파일 커스텀 전용 도구. 신규 컨트롤러엔 부적합)
- ✅ **진짜 경로 = 관리자 [FTP/DB 관리]의 SFTP 계정** (WebFTP 위젯과 별개, .php 업로드 가능):
  - 프로토콜 **SFTP** / 포트 **17662** / host `gdadmin-dalbapiedmot.godomall.com` / id `bmonument` / pw는 최초 접속 전 설정(90일 만료).
  - ⚠️ **접속 허용 IP 등록 필수**(휴대폰 인증) — 안 하면 접속 거부. 접속 실패 1순위 원인.
  - **개발 FTP → `/data/module/`(개발소스) / 운영 FTP → `/module/`(운영소스)** 로 분리돼 있음.
- **배포 절차(권장)**: 개발 FTP로 `/data/module/Controller/Front/Professional/ProVerifyController.php` 업로드(폴더 707) → 개발소스관리>"운영소스 적용하기". (또는 운영 FTP로 `/module/...` 직접 업로드 = 적용하기 불필요)
- **근거**: NHN이 "별도 신규 페이지 추가 = '사용자 페이지 추가하기' 가이드대로" 확인. 우리 컨트롤러가 그 가이드 규칙(원본 class 상속 / use / index()) 준수 = 자동패치에도 안전(how-to-tuning 문서).

**현재 블로커 = 웹앤모바일 PHP 8.2 업그레이드 (배포 타이밍 대기)**
- 웹앤모바일 측 **PHP 7 → 8.2 업그레이드 진행 중**, 그 기간엔 별도 개발 자제 요청.
- 우리 파일은 **기존 소스 무수정 + 신규 독립 파일 1개**라 기능 충돌 위험은 낮고, 코드도 **8.2 호환**(속성 명시 선언 → dynamic property deprecated 무관, 표준 함수만). → 담당자에 문의: ① 신규 독립 파일도 지금은 피할지 ② **업그레이드가 커스텀 소스(/module,/data/module)를 초기화/덮어쓰는지**(그렇다면 지금 올려도 날아감 → 완료 후 배포).
- → 결론: **업그레이드 완료(+커스텀 소스 보존 확인) 후 SFTP로 배포.** 파일·verify.js는 준비 완료, GO 사인만 대기.

### D. 키 (배포본에만 입력, git 커밋 금지)
- `ProVerifyController.php`의 `$ntsKey`(국세청 Encoding), `$partnerKey`(제휴사), `$mallKey`(쇼핑몰). 실제 값은 사용자 보관(문서/깃엔 미기재).

### E. 고도몰5 라우팅 규칙 (학습)
- **Front**: `Controller\Front\{Folder}\{Name}Controller` → `/{folder소문자}/{name_snake}.php` (같은 도메인). 예: `Goods\AddtionalInfoController`→`/goods/addtionalInfo.php`.
- **Api**: `Controller\Api\{Folder}\{Name}Controller` → `api.{도메인}/{folder}/{name_snake}` (서브도메인 → CORS/세션 이슈로 브라우저 호출엔 부적합 → **Front 선택**).
- 배포: 관리자 SFTP로 `/data/module/`(개발소스)에 파일 배치 → 개발소스관리>개발작업소스 보기>"운영소스로 적용하기". (또는 운영 FTP로 `/module/` 직접 업로드) — 상세 §C. WebFTP 위젯은 PHP 불가라 사용 안 함.

### F. 재개 시 할 일 (체크리스트, 260805 갱신)
- [ ] **(대기) PHP 8.2 업그레이드 종료 + 커스텀 소스 보존 확인** → 담당자 GO 사인
- [ ] SFTP 접속 준비: **비밀번호 설정 + 접속 허용 IP 등록**(휴대폰 인증)
- [ ] `ProVerifyController.php`에 **키 3개 입력**(배포본만) → 개발 FTP `/data/module/Controller/Front/Professional/`(707) 업로드 → "운영소스 적용하기" (또는 운영 FTP `/module/...` 직접)
- [ ] URL 자가테스트: GET `https://www.dalba.co.kr/professional/pro_verify.php`(안 되면 `proVerify.php`) → `{"ok":false,"message":"허용되지 않은 접근 방식입니다."}` 뜨면 정상. (빈화면/500이면 빈 스킨 `professional/pro_verify.html` 추가)
- [ ] `verify.js` `VERIFY_API_URL` = 확정 URL → WebFTP 업로드
- [ ] 관리자: 프로페셔널 등급별 **제휴가/상품노출**, 승인 **SMS/알림톡**
- [ ] **거래동의 약관 페이지** `professional/terms_deal.html` (약관 텍스트 대기)
- [ ] (선택) 사업자번호 **제목에 포함** 시켜 관리자 중복 스캔 편의

### G. WebFTP 스킨 업로드 — ✅ 전부 완료 (260805)
- ✅ 업로드 완료: `js/professional/verify.js` · `professional/verify.html` · `css/professional/verify.css` · `css/professional/pro.css` · `outline/footer/standard.html`(⚠️공용) + 나머지 professional 스킨/이미지(라이브 확인됨).
- **WebFTP로 올릴 건 남은 게 없음.** 유일한 잔여 = PHP 컨트롤러 1건(§C, SFTP·8.2 대기).
- (재배포 시) `verify.js`는 `VERIFY_API_URL` 확정값 반영 후 **1회 재업로드**만 남음.
