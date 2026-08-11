/**
 * professional/pro.js — Pro 랜딩(pro.html) 상태별 흐름
 *
 *  · 비로그인            → 로그인 하기 / 달바 통합 회원가입하기 (템플릿 분기)
 *  · 로그인 + 프로 아님   → 사업자/디자이너 인증하고 혜택받기 → verify.html
 *  · 로그인 + 프로페셔널   → 헤어샵 전용 제품 리스트 노출 (템플릿 분기, pro.html 내)
 *
 *  회원가입 흐름: "달바 통합 회원가입하기" 클릭 시 sessionStorage 표식 →
 *  회원가입 완료 페이지(join_ok.html)가 이 표식을 보고 pro.html로 복귀 →
 *  복귀 시 로그인 상태면 인증 안내 모달 자동 오픈.
 */
(function () {
    "use strict";

    var VERIFY_URL = "/main/html.php?htmid=professional/verify.html";
    var INTENT_KEY = "proApplyIntent";

    function safeGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    function safeDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

    // 회원가입 버튼: pro 신청 의도 표식 남기고 회원가입으로 이동(기본 href 유지)
    var joinBtn = document.querySelector(".js-pro-join");
    if (joinBtn) {
        joinBtn.addEventListener("click", function () {
            safeSet(INTENT_KEY, "1");
        });
    }

    // 인증 버튼: 신청 폼(verify.html)으로
    var verifyBtn = document.querySelector(".js-pro-verify");
    if (verifyBtn) {
        verifyBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = VERIFY_URL;
        });
    }

    // 인증 안내 모달
    var modal = document.getElementById("proVerifyModal");
    function openModal() {
        if (!modal) return;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }
    function closeModal() {
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = "";
    }
    if (modal) {
        var confirmBtn = modal.querySelector(".js-modal-confirm");
        if (confirmBtn) confirmBtn.addEventListener("click", function () { window.location.href = VERIFY_URL; });
        var closeEls = modal.querySelectorAll(".js-modal-close");
        Array.prototype.forEach.call(closeEls, function (el) { el.addEventListener("click", closeModal); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    }

    // 회원가입 완료 후 복귀 감지 → 로그인 상태면 모달 자동 오픈
    // (proIsLogin 은 pro.html 템플릿에서 주입)
    if (safeGet(INTENT_KEY)) {
        safeDel(INTENT_KEY);
        if (typeof window.proIsLogin !== "undefined" && window.proIsLogin) {
            openModal();
        }
    }
})();
