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

    // ===== 사업자등록번호 진위확인 (국세청 상태조회 API, 브라우저 직접 호출) =====
    // 공공데이터포털 "국세청_사업자등록정보 진위확인 및 상태조회" → CORS 허용됨.
    // ⚠️ 발급받은 serviceKey(Decoding 키)를 아래에 넣어야 동작함. JS에 노출되지만 read-only·1일100만건이라 저위험.
    //    (추후 서버리스 프록시로 옮기려면 NTS_STATUS_URL 만 우리 함수 주소로 바꾸면 됨)
    // 서버리스(진위+중복 통합) 주소. 배포 후 여기에 넣으면 → 국세청 직접호출 대신 서버리스로 전환(중복확인 포함).
    var VERIFY_API_URL = ""; // 배포 후 입력. Front 컨트롤러면 같은 도메인: "/professional/pro_verify.php"
    var NTS_SERVICE_KEY = "여기에_국세청_serviceKey_입력";
    var NTS_STATUS_URL = "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=" + encodeURIComponent(NTS_SERVICE_KEY);

    function verifyBusinessNo(bno) {
        // 서버리스 배포 후: 진위 + 중복 한 번에 (국세청/고도몰 키 모두 서버에 숨김)
        if (VERIFY_API_URL) {
            return fetch(VERIFY_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bno: bno })
            })
                .then(function (r) { return r.json(); })
                .then(function (r) { return { ok: !!r.ok, message: r.message || (r.ok ? "확인되었습니다." : "확인에 실패했습니다.") }; });
        }
        // 서버리스 배포 전 임시: 국세청 직접 호출(진위만, 중복 미포함)
        return fetch(NTS_STATUS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ b_no: [bno] })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var item = data && data.data && data.data[0];
                if (!item) return { ok: false, message: "조회 결과가 없습니다. 번호를 확인해주세요." };
                if (item.tax_type && item.tax_type.indexOf("등록되지 않은") !== -1) {
                    return { ok: false, message: "국세청에 등록되지 않은 사업자등록번호입니다." };
                }
                if (item.b_stt_cd === "01" || item.b_stt === "계속사업자") {
                    return { ok: true, message: "정상 사업자로 확인되었습니다." };
                }
                return { ok: false, message: (item.b_stt || "휴업/폐업") + " 상태의 사업자는 신청할 수 없습니다." };
            });
    }

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
            busiCheckBtn.disabled = true;
            showBusiMsg("확인 중...", true);
            verifyBusinessNo(v)
                .then(function (r) {
                    busiCheckBtn.disabled = false;
                    busiChecked = !!r.ok;
                    showBusiMsg(r.message, r.ok);
                })
                .catch(function () {
                    busiCheckBtn.disabled = false;
                    busiChecked = false;
                    showBusiMsg("진위확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", false);
                });
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
            if (!busiChecked) { showError("사업자등록번호 확인 버튼을 눌러 진위확인을 진행해주세요."); return; }
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
    // 고도몰 게시판 파일업로드 1단계: 파일을 board_ps.php(mode=ajaxUpload)로 임시 업로드 → saveFileNm(temp URL) 확보
    function ajaxUploadFile(file) {
        var fd = new FormData();
        fd.append("bdId", "proapply");
        fd.append("mode", "ajaxUpload");
        fd.append("uploadFile", file); // ⚠️ 고도몰 board_ps 는 파일을 'uploadFile' 단일 필드로 받음 (upfiles[] 아님)
        return fetch("/board/board_ps.php", { method: "POST", body: fd, credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (t) {
                var data = null;
                try { data = JSON.parse(t); } catch (e) {
                    var mm = t.match(/\{[\s\S]*\}/);
                    if (mm) { try { data = JSON.parse(mm[0]); } catch (e2) {} }
                }
                if (!data || data.result !== "ok" || !data.saveFileNm) {
                    throw new Error((data && data.errorMsg) || "파일 업로드에 실패했습니다.");
                }
                return { name: data.uploadFileNm || file.name, saveFileNm: data.saveFileNm };
            });
    }

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

        var files = [];
        var bizFile = document.getElementById("fileBizCert").files[0];
        if (bizFile) files.push(bizFile);
        if (type === "designer") {
            var dFile = document.getElementById("fileDesignerCert").files[0];
            if (dFile) files.push(dFile);
        }

        if (submitBtn) submitBtn.disabled = true;

        // 1) 파일 임시 업로드 → 2) uploadType=ajax + uploadFileNm/saveFileNm 로 게시글 등록
        Promise.all(files.map(ajaxUploadFile))
            .then(function (uploaded) {
                var fd = new FormData();
                fd.append("bdId", "proapply");
                fd.append("sno", "");
                fd.append("mode", "write");
                fd.append("returnUrl", "bdId=proapply");
                fd.append("category", category);
                fd.append("subject", subject);
                fd.append("contents", contents);
                fd.append("writerMobile", shopTel);
                if (uploaded.length) {
                    fd.append("uploadType", "ajax");
                    uploaded.forEach(function (u, i) {
                        fd.append("uploadFileNm[" + (i + 1) + "]", u.name);
                        fd.append("saveFileNm[" + (i + 1) + "]", u.saveFileNm);
                    });
                }
                return fetch("/board/board_ps.php", { method: "POST", body: fd, credentials: "same-origin" }).then(function (r) { return r.text(); });
            })
            .then(function (text) {
                if (submitBtn) submitBtn.disabled = false;
                // 고도몰 board_ps 는 실패 시 alert(...) + history.back() HTML을 반환
                if (/history\.back/.test(text)) {
                    var m = text.match(/alert\(['"]([\s\S]*?)['"]\)/);
                    showError(m ? m[1].replace(/\\n/g, " ") : "신청 등록에 실패했습니다. 입력값을 확인해주세요.");
                    return;
                }
                // 성공 → 고도몰 게시판으로 보내지 않고 우리 완료 패널 표시
                var main = document.getElementById("proVerifyMain");
                var done = document.getElementById("proVerifyDone");
                if (main) main.hidden = true;
                if (done) done.hidden = false;
                window.scrollTo(0, 0);
            })
            .catch(function (err) {
                if (submitBtn) submitBtn.disabled = false;
                showError(err && err.message ? err.message : "신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            });
    }
})();
