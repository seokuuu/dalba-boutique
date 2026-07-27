# 관리자 설정 가이드 (축2 Pro 가입 관련)

`member_joinitem.php` 는 **관리자스킨 소스관리 › 관리자 스킨소스 보기 › member** 의 소스(참고용 복제본).
직접 수정하는 파일이 아니라, **관리자 화면에서 설정할 항목의 근거**로 둔다.

## 이 소스로 확인된 것 (파일 업로드 = 관리자 설정 가능)
- `comCertification[use/require]` (L354~) = **사업자등록증** 첨부 on/필수/용량
- `comAddiCert[N][name/use/require]` (L372~) = **추가 첨부 항목**(항목명 지정, 추가/삭제)
  → **"디자이너 자격증" 항목을 여기서 생성** 가능

## 관리자에서 켜야 할 것
- [ ] 가입항목 설정: 사업자등록증(comCertification) use + require
- [ ] 가입항목 설정: 추가첨부(comAddiCert)에 "디자이너 자격증" 항목 추가 + require
- [ ] 회원등급: 디자이너 전용 등급 신설 (member_group_register.php)
- [ ] 가입 승인제 on + Pro 전용 승인 관리자 권한
- [ ] 승인완료 알림: SMS / 카카오 알림톡 (sms_auto.php / kakao_alrim_luna_setting.php)
- [ ] 등급별 제휴가(할인가) 설정

## 프론트 연동 주의
관리자에서 comCertification/comAddiCert 를 켜도, **프론트 스킨 `_join_view_business.html` 에 파일필드 렌더 마크업이 있어야** 실제 노출됨.
→ webftp/member/README-pro-join.md 참조 (고도몰 원본소스 이식 필요).
