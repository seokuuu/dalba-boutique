// ============================================================
// Terms Deal Module (PROFESSIONAL) — 거래동의 약관 (게시판 최신글 본문 렌더)
// ------------------------------------------------------------
// verify.html '전체보기' → 이 페이지. 살롱·헤어디자이너 거래동의 약관을
//   전용 게시판(bdId=salonterms)에 게시글로 등록하면 그 "최신 글" 본문을 표시.
//   운영: 약관 수정 시 새 글을 등록하면 최신 글이 자동 노출됨.
// 방식(articles.js 목록파싱 + store.js 본문파싱 패턴):
//   1) /board/list.php?bdId=salonterms fetch → 최신(첫) 글 sno 추출
//   2) /board/view.php?bdId=..&sno=.. fetch → 본문(.board_view_content .seem_cont) 추출 → 주입
// ============================================================

(function (window) {
    window.professional = window.professional || {};
    if (window.professional.termsDeal) return;

    function boardListUrl(bdid) {
        return "/board/list.php?bdId=" + encodeURIComponent(bdid);
    }

    function fallback(box, bdid, msg) {
        box.innerHTML =
            '<p class="terms__empty">' + msg +
            ' <a href="' + boardListUrl(bdid) + '" target="_blank" rel="noopener">게시판에서 보기</a></p>';
    }

    // 목록에서 최신(첫) 글 sno 추출 (articles.js 와 동일한 gd_btn_view 파싱)
    function latestSno(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var links = doc.querySelectorAll(".board_tit a");
        for (var i = 0; i < links.length; i++) {
            var a = links[i];
            var trig = (a.getAttribute("href") || "") + (a.getAttribute("onclick") || "");
            var m = trig.match(/gd_btn_view\([^,]*,\s*(\d+)/);
            if (m) return m[1];
        }
        return "";
    }

    // 상세(view) 본문 추출 (store.js fetchStoreDetail 와 동일 셀렉터)
    function viewBody(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var body = doc.querySelector(".board_view_content .seem_cont") || doc.querySelector(".seem_cont");
        return body ? body.innerHTML : "";
    }

    function load(box) {
        var bdid = box.getAttribute("data-bdid") || "salonterms";
        if (typeof window.fetch !== "function") {
            fallback(box, bdid, "약관을 불러올 수 없습니다.");
            return;
        }
        window
            .fetch(boardListUrl(bdid), { credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (listHtml) {
                var sno = latestSno(listHtml);
                if (!sno) {
                    box.innerHTML = '<p class="terms__empty">등록된 약관이 없습니다.</p>';
                    return null;
                }
                return window
                    .fetch("/board/view.php?bdId=" + encodeURIComponent(bdid) + "&sno=" + sno, { credentials: "same-origin" })
                    .then(function (r) { return r.text(); })
                    .then(function (viewHtml) {
                        var inner = viewBody(viewHtml);
                        if (inner) box.innerHTML = inner;
                        else fallback(box, bdid, "약관 본문을 불러오지 못했습니다.");
                    });
            })
            .catch(function () { fallback(box, bdid, "약관을 불러오지 못했습니다."); });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var box = document.getElementById("termsBody");
        if (box) load(box);
    });

    window.professional.termsDeal = { load: load };
})(window);
