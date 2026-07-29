/**
 * professional/pro.js — Pro 랜딩(pro.html) 로그인 연동
 *
 * 방식(고도몰 member/login.html과 동일):
 *  1) 페이지 로드 시 /member/login.php 를 same-origin fetch → hidden 값 secretKey/mode 파싱
 *     (fetch가 세션 쿠키를 공유하므로 여기서 발급된 secretKey가 login_ps.php 세션과 일치)
 *  2) 제출 시 loginId/loginPwd 를 AES-256-CBC(PBKDF2)로 암호화 (CryptoJS, pro.html에서 로드)
 *  3) $.post('/member/login_ps.php') → JSON {code,message,url} 처리
 *  4) CryptoJS/secretKey 미확보 등 예외 시 표준 로그인 페이지(/member/login.php)로 폴백
 */
(function () {
    "use strict";

    var form = document.getElementById("proLoginForm");
    if (!form) return;

    var idInput = document.getElementById("proLoginId");
    var pwInput = document.getElementById("proLoginPwd");
    var errEl = form.querySelector(".pro-login__error");
    var submitBtn = form.querySelector(".pro-login__submit");

    // 로그인 성공 후 이동할 곳 (Pro 메인)
    var RETURN_URL = "/main/html.php?htmid=professional/index.html";

    var state = { secretKey: "", mode: "login", ready: false };

    // login.html 의 Encryption 객체 그대로 (AES-256-CBC + PBKDF2)
    var Encryption = {
        get encryptMethod() {
            return "AES-256-CBC";
        },
        get encryptMethodLength() {
            var encryptMethod = this.encryptMethod;
            var aesNumber = encryptMethod.match(/\d+/)[0];
            return parseInt(aesNumber);
        },
        encrypt: function (string, key) {
            var iv = CryptoJS.lib.WordArray.random(16);
            var salt = CryptoJS.lib.WordArray.random(256);
            var iterations = 999;
            var encryptMethodLength = this.encryptMethodLength / 4;
            var hashKey = CryptoJS.PBKDF2(key, salt, { hasher: CryptoJS.algo.SHA512, keySize: encryptMethodLength / 8, iterations: iterations });
            var encrypted = CryptoJS.AES.encrypt(string, hashKey, { mode: CryptoJS.mode.CBC, iv: iv });
            var encryptedString = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
            var output = {
                ciphertext: encryptedString,
                iv: CryptoJS.enc.Hex.stringify(iv),
                salt: CryptoJS.enc.Hex.stringify(salt),
                iterations: iterations
            };
            return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(output)));
        }
    };

    // 세션 secretKey/mode 확보
    function fetchLoginKeys() {
        return fetch("/member/login.php", { credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (html) {
                var sk = html.match(/id="secretKey"[^>]*value="([^"]*)"/);
                var md = html.match(/id="mode"[^>]*value="([^"]*)"/);
                if (sk && sk[1]) state.secretKey = sk[1];
                if (md && md[1]) state.mode = md[1];
                state.ready = !!state.secretKey;
            })
            .catch(function () { state.ready = false; });
    }
    fetchLoginKeys();

    function showError(msg) {
        if (!errEl) { alert(msg); return; }
        errEl.textContent = msg;
        errEl.hidden = false;
    }
    function clearError() {
        if (errEl) errEl.hidden = true;
    }
    idInput.addEventListener("input", clearError);
    pwInput.addEventListener("input", clearError);

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearError();

        var id = idInput.value.trim();
        var pw = pwInput.value;
        if (!id || !pw) { showError("아이디와 비밀번호를 입력해주세요."); return; }

        // CryptoJS/secretKey 미확보 시 표준 로그인 페이지로 폴백
        if (typeof CryptoJS === "undefined" || !state.secretKey) {
            window.location.href = "/member/login.php";
            return;
        }

        var params = {
            mode: state.mode || "login",
            encryptFl: "Y",
            secretKey: state.secretKey,
            returnUrl: RETURN_URL,
            loginId: Encryption.encrypt(id, state.secretKey),
            loginPwd: Encryption.encrypt(pw, state.secretKey)
        };

        if (submitBtn) submitBtn.disabled = true;

        window.jQuery.post("/member/login_ps.php", params)
            .done(function (data) {
                // login.html 원본 로직: code/message 없으면 성공
                var code = data && data.code;
                var message = data && data.message;
                var url = data && data.url;
                if (typeof code === "undefined" && typeof message === "undefined") {
                    window.location.href = RETURN_URL;
                } else {
                    showError(message || "아이디, 비밀번호가 일치하지 않습니다.");
                    if (typeof url !== "undefined" && url) window.location.href = url;
                }
            })
            .fail(function () {
                showError("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            })
            .always(function () {
                if (submitBtn) submitBtn.disabled = false;
            });
    });
})();
