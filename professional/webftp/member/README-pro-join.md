# Pro 회원가입 스킨 개조 가이드 (축2)

이 폴더의 `.html`/`.js` 는 **dalba_main 공용 가입 스킨의 복제본(base)** 이다.
실제 원본 소스로 직접 검증한 결과를 토대로, Pro 전용 가입에서 **바꿔야 할 부분만** 아래에 정리한다.

> ⚠️ 아키텍처 원칙: 공용 `member/join.php`/`join_agreement.php` 를 **직접 덮어쓰지 말 것**
> (일반 회원가입에 영향). Pro 전용 신규 컨트롤러 + Pro 전용 스킨으로 분기하고,
> 핵심 로직(ID/PW 검증·중복체크·약관저장·회원 insert)은 기존 `gd_member2.js` + join 로직을 재사용/모방.

---

## 🔁 파일 업로드 결론 수정 (중요)

기존 dalba_pro.md §3 은 "파일업로드 = 100% 순수 신규 개발" 이라 했으나, **실제 소스 확인 결과 틀림.**

- **고도몰 기본 기능으로 파일첨부가 존재** → `admin/member/member_joinitem.php` (사업자정보 섹션):
  - `comCertification[use/require]` = **사업자등록증** 업로드 (사용/필수/용량 관리자 설정)
  - `comAddiCert[N][name/use/require]` = **추가 첨부 항목** (항목명 관리자 지정, 추가/삭제 가능)
    → **"디자이너 자격증" 을 comAddiCert 항목으로 관리자에서 생성 가능**
- 다만 현재 프론트 스킨 `_join_view_business.html` 에는 이 파일필드 **렌더링 마크업이 빠져있음**
  (상호/사업자번호/대표자명/업태/종목/주소만 렌더). → **고도몰 원본소스의 마크업을 스킨에 되살리는 수준**.

### ✅ 확인 필요 (착수 전)
- [ ] **고도몰 원본소스 `_join_view_business.html`** 확보 (쇼핑몰 소스관리 › 고도몰 원본소스 보기 › member)
      → 원본에 comCertification/comAddiCert 렌더링 파트가 있으면 그대로 이식, 없으면 소량 신규.
- [ ] comAddiCert 가 사업자정보 블록 소속이라 **디자이너(개인) 유형에도 노출**되는지 → 토글 로직 조정 필요 여부.

---

## 개조 대상 3가지 (근거 = 실제 소스 라인)

### 1) 회원유형: 개인/사업자 → 사업자(원장)/디자이너
- `join.html` L22-41 `memberFl` 라디오(`personal`/`business`) + L104-113 토글 스크립트.
- Figma: 사업자(원장) vs 디자이너. `businessinfo.use == 'y'` 조건으로 사업자정보 블록 토글되는 구조 재사용.

### 2) 파일 업로드 (사업자등록증 / 디자이너 자격증)
- `join.html` L15 `<form ... method="post">` 에 **`enctype="multipart/form-data"` 추가** 필요 (현재 없음).
- `_join_view_business.html` 에 comCertification/comAddiCert **`<input type="file">` 렌더 추가** (원본소스 이식).
- 관리자: `member_joinitem.php` 에서 comCertification(사업자등록증) + comAddiCert(디자이너 자격증) **use/require 켜기**.

### 3) 3번째 필수 약관 "(필수) 살롱·헤어디자이너 거래 동의"
- `join_agreement.html`:
  - 필수 검증은 **`class="require"` 기반** (L243 `$(':checkbox.require').each(...)`).
  - 기존 필수: `termsAgree1`(이용약관, L51) / `termsAgree2`(개인정보, L64) 만 `class="require"`.
  - 추가 약관(termsAgree3/4/5)은 전부 `(선택)`.
  - → **거래동의 체크박스에 `class="require"` + name 부여** 하면 프론트 필수검증 자동 적용.
  - 약관 본문은 `service/agreement.php?code=` 패턴 재사용.
- **백엔드**: 이 동의 값을 회원 레코드에 저장해야 하는지(법적 요구)에 따라 컨트롤러 처리 필요/불필요 갈림 (법률자문 확인 중 — dalba_pro.md §8).

---

## Figma 5단계 매핑 (PRO-PC-kr-01~03-2)
| 단계 | Figma | 대응 파일 | 비고 |
|---|---|---|---|
| 랜딩(접근제한) | PRO-01 | `professional/pro.html` (축1에서 생성) | 게이트, 가입 버튼 |
| 유형선택 | PRO-02 | `join.html`(memberFl) 또는 `join_method.html` | 사업자/디자이너 |
| 휴대폰 본인인증 | PRO-03-1 | `join_agreement.html`(기존 아이핀/휴대폰) | 신규 아님, 기존 스텝 흡수 |
| 정보입력(+파일) | PRO-03-2 | `join.html` + `_join_view*.html` | 파일업로드 = 위 2) |
| 약관동의 | PRO-03-2 | `join_agreement.html` | 3번째 필수 = 위 3) |
| 승인대기 | - | `join_wait.html` | 기존 재사용 |

## 남은 작업
- [ ] 고도몰 원본소스 `_join_view_business.html` 확보 후 파일필드 이식 확정
- [ ] Pro 전용 컨트롤러/진입 URL 확정 (`pro.html` 의 가입 버튼 href 교체)
- [ ] 관리자: 디자이너 전용 등급 신설 + 가입 승인제 + 승인알림(SMS/알림톡) + 등급별 제휴가
