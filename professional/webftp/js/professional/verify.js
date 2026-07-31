/**
 * professional/verify.js — PRO 인증 신청 폼 (Figma 334-73)
 *
 *  · 유형 탭(사업자/디자이너) 전환 → 노출 필드/제출 라벨/필수값 변경
 *  · 파일찾기(커스텀) → 숨김 file input 트리거 + 파일명 표시
 *  · 사업자등록번호 형식 검증(+중복확인 버튼: 실제 중복판별은 관리자 승인 단계에서. 비밀글 게시판이라 회원간 조회 불가)
 *  · 제출 검증 → proapply 게시판 등록 (⚠️ 실제 전송은 board/write 필드 확인 후 submitToBoard 완성 필요)
 */
(function () {
    "use strict";

    var form = document.getElementById("proVerifyForm");
    if (!form) return;

    var applyTypeInput = document.getElementById("applyType");
    var submitBtn = form.querySelector(".js-verify-submit");
    var errEl = form.querySelector(".js-form-error");

    function showError(msg) {
        if (!errEl) { alert(msg); return; }
        errEl.textContent = msg;
        errEl.hidden = false;
    }
    function clearError() { if (errEl) errEl.hidden = true; }

    // ===== 유형 탭 전환 =====
    var tabs = document.querySelectorAll(".js-verify-tab");
    function setType(type) {
        applyTypeInput.value = type;
        Array.prototype.forEach.call(tabs, function (t) {
            t.classList.toggle("is-active", t.getAttribute("data-type") === type);
        });
        // 사업자 전용 / 디자이너 전용 노출
        Array.prototype.forEach.call(document.querySelectorAll(".js-type-business"), function (el) {
            el.hidden = type !== "business";
        });
        Array.prototype.forEach.call(document.querySelectorAll(".js-type-designer"), function (el) {
            el.hidden = type !== "designer";
        });
        if (submitBtn) submitBtn.textContent = type === "designer" ? "디자이너 인증 신청" : "사업자 인증 신청";
        clearError();
    }
    Array.prototype.forEach.call(tabs, function (t) {
        t.addEventListener("click", function () { setType(t.getAttribute("data-type")); });
    });
    setType("business");

    // ===== 파일찾기(커스텀) =====
    Array.prototype.forEach.call(document.querySelectorAll(".js-file-trigger"), function (btn) {
        btn.addEventListener("click", function () {
            var input = document.getElementById(btn.getAttribute("data-target"));
            if (input) input.click();
        });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".verify__file"), function (input) {
        input.addEventListener("change", function () {
            var nameField = input.parentNode.querySelector(".js-file-name");
            if (nameField) nameField.value = input.files && input.files[0] ? input.files[0].name : "";
        });
    });

    // ===== 사업자등록번호 형식 검증 + 중복확인 =====
    // 실제 중복 판별은 비밀글 게시판 특성상 회원간 조회 불가 → 관리자 승인 단계에서 확인(dalba_pro.md 참조).
    var busiChecked = false;
    var busiInput = document.getElementById("busiNo");
    var busiMsg = form.querySelector(".js-busino-msg");
    function showBusiMsg(msg, ok) {
        if (!busiMsg) return;
        busiMsg.textContent = msg;
        busiMsg.className = "verify__msg js-busino-msg " + (ok ? "is-ok" : "is-err");
        busiMsg.hidden = false;
    }
    if (busiInput) {
        busiInput.addEventListener("input", function () { busiChecked = false; if (busiMsg) busiMsg.hidden = true; });
    }
    var busiCheckBtn = form.querySelector(".js-busino-check");
    if (busiCheckBtn) {
        busiCheckBtn.addEventListener("click", function () {
            var v = (busiInput.value || "").replace(/[^0-9]/g, "");
            if (v.length !== 10) { showBusiMsg("사업자등록번호 10자리를 정확히 입력해주세요.", false); busiChecked = false; return; }
            // TODO(server): 실제 중복 여부는 관리자/서버 확인. 현재는 형식 확인만.
            busiChecked = true;
            showBusiMsg("확인되었습니다. (최종 중복 여부는 관리자 승인 시 확인됩니다)", true);
        });
    }

    // ===== 제출 검증 =====
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError();
        var type = applyTypeInput.value;

        if (type === "business") {
            var busi = (busiInput.value || "").replace(/[^0-9]/g, "");
            if (busi.length !== 10) { showError("사업자등록번호를 정확히 입력해주세요."); return; }
            if (!busiChecked) { showError("사업자등록번호 중복확인을 진행해주세요."); return; }
        }
        if (!form.company.value.trim()) { showError("매장상호명을 입력해주세요."); return; }

        var bizCert = document.getElementById("fileBizCert");
        if (!bizCert.files || !bizCert.files[0]) { showError("사업자등록증 파일을 첨부해주세요."); return; }

        if (type === "designer") {
            var dCert = document.getElementById("fileDesignerCert");
            if (!dCert.files || !dCert.files[0]) { showError("디자이너자격증 파일을 첨부해주세요."); return; }
        }

        if (!form.agreeDeal.checked) { showError("살롱/헤어디자이너 거래 동의(필수)에 체크해주세요."); return; }

        submitToBoard();
    });

    // ===== proapply 게시판 등록 (FormData + fetch → board/board_ps.php) =====
    // 스킨에 board 폼을 두면 고도몰 보안필터가 500 → JS가 FormData로 전송.
    // ⚠️ proapply 게시판 "자동등록방지(captcha)"는 OFF 필요 (켜져 있으면 등록 거부 → 아래 에러로 표시됨).
    function submitToBoard() {
        var type = applyTypeInput.value;
        var category = (type === "designer") ? "디자이너" : "사업자(원장)";
        var company = form.company.value.trim();
        var shopTel = form.shopTel.value.trim();
        var busiNo = busiInput ? busiInput.value.replace(/[^0-9]/g, "") : "";

        var subject = "[" + category + "] " + company;
        var lines = ["신청유형: " + category];
        if (type === "business") lines.push("사업자등록번호: " + busiNo);
        lines.push("매장상호명: " + company);
        lines.push("매장전화번호: " + (shopTel || "-"));
        var contents = lines.join("<br>");

        var fd = new FormData();
        fd.append("bdId", "proapply");
        fd.append("sno", "");
        fd.append("mode", "write");
        fd.append("returnUrl", "bdId=proapply");
        fd.append("category", category);
        fd.append("subject", subject);
        fd.append("contents", contents);
        fd.append("writerMobile", shopTel);

        var bizFile = document.getElementById("fileBizCert").files[0];
        if (bizFile) fd.append("upfiles[]", bizFile);
        if (type === "designer") {
            var dFile = document.getElementById("fileDesignerCert").files[0];
            if (dFile) fd.append("upfiles[]", dFile);
        }

        if (submitBtn) submitBtn.disabled = true;

        fetch("/board/board_ps.php", { method: "POST", body: fd, credentials: "same-origin" })
            .then(function (res) { return res.text(); })
            .then(function (text) {
                if (submitBtn) submitBtn.disabled = false;
                // 고도몰 board_ps 는 실패 시 alert(...) + history.back() HTML을 반환
                if (/history\.back/.test(text)) {
                    var m = text.match(/alert\(['"]([\s\S]*?)['"]\)/);
                    showError(m ? m[1].replace(/\\n/g, " ") : "신청 등록에 실패했습니다. 입력값을 확인해주세요.");
                    return;
                }
                // 성공 → 신청 접수 목록(본인 비밀글)으로 이동
                window.location.href = "/board/list.php?bdId=proapply";
            })
            .catch(function () {
                if (submitBtn) submitBtn.disabled = false;
                showError("신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            });
    }
})();
