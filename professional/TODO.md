# d'Alba PROFESSIONAL — TODO

> 최종 갱신: 2026-08-06 · 상세 맥락은 `dalba_pro.md` 참조 (이 파일은 할일 요약)

**범례**
- 🟢 할것 — 지금 진행 가능 (코드/권한만 있으면 됨, 블로커 없음)
- 🟡 대기 — 자산·확정·업그레이드 등 선행 조건 필요
- ✅ 완료

---

## 🟢 할것
- [ ] **네이버 Geocoding API 사용신청** (관리자) — salon 좌표 직접 입력 시 생략 가능

---

## 🟡 대기
- [ ] **product 탭** → 달바 > product > **헤어/바디** 카테고리 제품 연결 (goodsNo 필요)
- [ ] **pro 헤어샵 전용 제품 카드 채우기** → pro.html `.pro-exclusive__list`에 달바 **헤어샵 전용** 카테고리 상품 카드(goodsNo, 제휴가, 쇼핑백·GWP 포함)
- [ ] **goodsNo** — 상품 6종 달바몰 등록 (위 product/pro 연결의 선행)
- [ ] **최종 카피 확정** (엔젤링/로제 엔젤링 vs 로제 프리지아·Peptide Exosome™)
- [ ] **성분소개 POINT 01~04** (엔젤링 성분 최종 카피 확정 후)
- [ ] Product hover 2번째컷 / 인물아바타 영상롤링 / 히어로 영상(mp4) / 브랜드스토리 심볼 루프 — **자산 대기**
- [ ] Product 카드 용량·가격 / 바탕 #FAFAFB / 흰 로고
- [ ] **ProVerifyController.php SFTP 배포** → verify.js `VERIFY_API_URL` 연결 → URL 테스트 (**웹앤모바일 PHP 8.2 업그레이드 후**)

---

## ✅ 완료
- (260806) pro.html + pro.css 재업로드 (등급분기 반영)
- (260806) salon(매장) 게시판 생성 + 매장 글 등록
- (260806) article(아티클) 게시판 생성 + 기사 글 등록
- (260806) 프로페셔널 등급 신설 + 등급별 제휴가 + 상품 노출 설정
- (260806) 승인 알림 세팅 (신청접수→관리자 / 승인완료→신청자)
- 프로페셔널 스킨 전체(메인 / product / store / articles / pro / verify) 제작 + 업로드
- 거래동의 약관: `terms_deal.html/js/css` + `salonterms` 게시판 + 약관글 (표시 확인)
- pro.html 등급분기 구현: 인증 시 헤어샵 전용 제품 섹션(스캐폴드) / 비인증 대문 · index 자동진입 제거 (260806)
- 진위/중복 검증(`ProVerifyController`) 코드 완료 (배포는 🟡)
- `proapply` 게시판 + verify 신청폼 + 파일업로드
- 기능정의서 작성 (`professional/기능정의서_프로페셔널_260805.md`)
- Store 스플릿뷰(검색리스트 + 상시 지도) 코드 구현
