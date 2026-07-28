// ============================================================
// Articles Module (PROFESSIONAL) - 게시판 연동 + 카테고리 탭
// ------------------------------------------------------------
// store와 동일 방식: 아티클 전용 게시판을 /board/list.php?bdId=<id> AJAX 로 불러와 카드 렌더.
// (고도몰 includeWidget 파라미터 미지원 → fetch 방식)
// 카테고리(NEWS/EVENT/COLLABORATION) = 게시판 "말머리". 목록 제목에 [말머리] 접두 형태로 노출되므로
//   제목에서 [..] 추출해 data-category 로 사용 → 상단 탭이 그걸로 필터.
//   ⚠️ 운영: 말머리를 NEWS / EVENT / COLLABORATION 으로 등록해야 탭 필터가 맞음.
// 목록 행에서 날짜(.regDate)·대표이미지(.board_img img)도 함께 파싱(있을 때).
// ============================================================

(function (window) {
    window.professional = window.professional || {};
    if (window.professional.articles) return;

    var state = { items: [] };

    function esc(s) {
        return String(s).replace(/"/g, "&quot;");
    }

    // ============================================================
    // 게시판 목록 fetch → 카드 데이터
    // ============================================================
    function fetchArticles(bdid, cb) {
        if (!bdid || typeof window.fetch !== "function") { cb(); return; }
        window
            .fetch("/board/list.php?bdId=" + encodeURIComponent(bdid), { credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (html) {
                try {
                    var doc = new DOMParser().parseFromString(html, "text/html");
                    var links = doc.querySelectorAll(".board_tit a");
                    var seen = {};
                    var items = [];
                    Array.prototype.forEach.call(links, function (a) {
                        var trig = (a.getAttribute("href") || "") + (a.getAttribute("onclick") || "");
                        var m = trig.match(/gd_btn_view\([^,]*,\s*(\d+)/);
                        if (!m) return;
                        var sno = m[1];
                        if (seen[sno]) return;
                        var strong = a.querySelector("strong");
                        var name = (strong ? strong.textContent : a.textContent).trim();
                        if (!name) return;
                        seen[sno] = true;

                        var titleBox = a.closest(".board_tit");
                        // 말머리(카테고리): 갤러리 = .board_tit 안 <em>[CATEGORY]</em> / 일반형 = 제목 접두 [..]
                        var category = "";
                        var emEl = titleBox ? titleBox.querySelector("em") : null;
                        var catText = emEl ? emEl.textContent : name;
                        var cm = catText.match(/\[([^\]]+)\]/);
                        if (cm) category = cm[1].trim();

                        // 컨테이너: 갤러리 .gallery_cont / 일반형 tr — 여기서 이미지·날짜 추출
                        var cont =
                            a.closest(".gallery_cont") ||
                            a.closest("tr") ||
                            a.closest("li") ||
                            (titleBox && titleBox.parentElement);
                        var date = "";
                        var img = "";
                        if (cont) {
                            var dateEl = cont.querySelector(".board_day, .textright");
                            date = dateEl ? dateEl.textContent.trim() : "";
                            var imgEl = cont.querySelector(".board_img img, img.js_image_load");
                            img = imgEl ? imgEl.getAttribute("src") || "" : "";
                        }
                        items.push({
                            sno: sno,
                            name: name,
                            category: category,
                            date: date,
                            image: img,
                            url: "/board/view.php?bdId=" + bdid + "&sno=" + sno,
                        });
                    });
                    state.items = items;
                    renderArticles(items);
                } catch (e) {
                    console.warn("[professional/articles] 목록 파싱 실패", e);
                }
                cb();
            })
            .catch(function () { cb(); });
    }

    function renderArticles(items) {
        var listEl = document.getElementById("articlesList");
        if (!listEl) return;
        if (!items.length) {
            listEl.innerHTML = '<li class="articles__empty">등록된 게시글이 없습니다.</li>';
            return;
        }
        listEl.innerHTML = items
            .map(function (it) {
                var imgHtml = it.image
                    ? '<img loading="lazy" class="articles__image" src="' + it.image + '" alt="' + esc(it.name) + '" />'
                    : '<span class="articles__noimg" aria-hidden="true"></span>';
                return (
                    '<li class="articles__item" data-category="' + esc(it.category) + '">' +
                    '<a href="' + it.url + '">' +
                    '<picture class="articles__picture">' + imgHtml + "</picture>" +
                    (it.category ? '<p class="articles__category">' + it.category + "</p>" : "") +
                    '<p class="articles__title">' + it.name + "</p>" +
                    (it.date ? '<p class="articles__date">' + it.date + "</p>" : "") +
                    "</a></li>"
                );
            })
            .join("");
    }

    // ============================================================
    // 카테고리 탭 필터
    // ============================================================
    function applyFilter(cat) {
        var items = document.querySelectorAll("#articlesList .articles__item");
        var up = (cat || "").toUpperCase();
        Array.prototype.forEach.call(items, function (li) {
            var c = (li.getAttribute("data-category") || "").toUpperCase();
            li.style.display = !up || c === up ? "" : "none";
        });
    }

    function setupTabs() {
        var tabs = document.querySelectorAll("#professional-articles .articles__tab");
        Array.prototype.forEach.call(tabs, function (tab) {
            tab.addEventListener("click", function () {
                Array.prototype.forEach.call(tabs, function (t) { t.classList.remove("is-active"); });
                tab.classList.add("is-active");
                applyFilter(tab.getAttribute("data-filter"));
            });
        });
    }

    // ============================================================
    // 초기화
    // ============================================================
    document.addEventListener("DOMContentLoaded", function () {
        var listEl = document.getElementById("articlesList");
        var bdid = listEl ? listEl.getAttribute("data-bdid") : "";
        setupTabs();
        fetchArticles(bdid, function () {
            var active = document.querySelector("#professional-articles .articles__tab.is-active");
            applyFilter(active ? active.getAttribute("data-filter") : "");
        });
    });

    window.professional.articles = { fetchArticles: fetchArticles };
})(window);
