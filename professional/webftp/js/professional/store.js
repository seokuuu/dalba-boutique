// ============================================================
// Store Module (PROFESSIONAL) - 스플릿뷰: 검색 리스트 + 상시 지도(전 매장 마커)
// ------------------------------------------------------------
// Figma STORE-PC-kr-01: 왼쪽 검색+리스트, 오른쪽 지도(모든 매장 마커 상시 표시,
//   선택 시 해당 매장으로 이동/하이라이트). 모달 아님.
// 데이터 출처: 매장 게시판 위젯(_board_article_store.html)이 #storeList 에 렌더한
//   <li data-name data-view-url ...>. 목록엔 본문 없음 → 각 매장 상세(view.php) fetch로
//   주소 파싱 → 지오코딩 → 마커. (data-lat/lng 나 본문이 목록에 있으면 fetch 생략)
// maps.js 에 &submodules=geocoder 필요.
// ============================================================

(function (window) {
    window.professional = window.professional || {};
    if (window.professional.store) return;

    var state = {
        map: null,
        bounds: null,
        placedCount: 0,
        stores: [],
        activeIndex: -1,
        geocodedCount: 0,
    };

    // ============================================================
    // 파서
    // ============================================================
    function parseHours(raw) {
        if (!raw) return [];
        return raw
            .split(/\s*[;|\n]\s*/)
            .filter(function (s) { return s; })
            .map(function (line) {
                var idx = line.indexOf(" ");
                if (idx > 0) return { day: line.slice(0, idx), time: line.slice(idx + 1) };
                return { day: line, time: "" };
            });
    }

    function parseContentLabels(raw) {
        var out = {};
        if (!raw) return out;
        var text = raw
            .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n") // 블록 종료 → 줄바꿈 (에디터 HTML 대응)
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            // HTML 엔티티 디코딩 (에디터가 넣는 &nbsp; 등 → 지오코딩 깨짐 방지)
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&quot;/gi, '"');
        var clean = function (s) {
            return s.trim().replace(/\s+/g, " ");
        };
        text.split(/\n+/).forEach(function (line) {
            line = line.trim();
            var m;
            if ((m = line.match(/^주소\s*[:：]\s*(.+)$/))) out.address = clean(m[1]);
            else if ((m = line.match(/^(?:전화|전화번호|연락처)\s*[:：]\s*(.+)$/))) out.phone = clean(m[1]);
            else if ((m = line.match(/^영업시간\s*[:：]\s*(.+)$/))) out.hours = clean(m[1]);
            else if ((m = line.match(/^좌표\s*[:：]\s*([\d.]+)\s*,\s*([\d.]+)$/))) {
                out.lat = parseFloat(m[1]);
                out.lng = parseFloat(m[2]);
            }
        });
        return out;
    }

    function applyLabels(store, labels) {
        if (!store.address && labels.address) store.address = labels.address;
        if (!store.phone && labels.phone) store.phone = labels.phone;
        if (!store.hoursLines.length && labels.hours) store.hoursLines = parseHours(labels.hours);
        if (store.lat == null && labels.lat != null) {
            store.lat = labels.lat;
            store.lng = labels.lng;
        }
    }

    function textOf(el, selector) {
        var node = el.querySelector(selector);
        return node ? node.textContent.trim() : "";
    }

    // ============================================================
    // DOM → storeData
    // ============================================================
    function buildStoresFromDOM() {
        var items = document.querySelectorAll("#storeList .store_list_item");
        var stores = [];
        Array.prototype.forEach.call(items, function (el, i) {
            var lat = parseFloat(el.getAttribute("data-lat"));
            var lng = parseFloat(el.getAttribute("data-lng"));
            var store = {
                el: el,
                index: i,
                name: el.getAttribute("data-name") || textOf(el, ".store_list_name"),
                category: el.getAttribute("data-category") || textOf(el, ".store_list_region"),
                address: el.getAttribute("data-address") || textOf(el, ".store_list_address"),
                phone: el.getAttribute("data-phone") || textOf(el, ".store_list_phone"),
                hoursLines: parseHours(el.getAttribute("data-hours")),
                viewUrl: el.getAttribute("data-view-url") || "",
                lat: isNaN(lat) ? null : lat,
                lng: isNaN(lng) ? null : lng,
                marker: null,
                _detailed: false,
            };
            applyLabels(store, parseContentLabels(el.getAttribute("data-content") || textOf(el, ".store_data_raw")));

            // 리스트 표시 보강 (게시판이 제목만 줘도 주소/전화 노출)
            var infoEl = el.querySelector(".store_list_info");
            if (infoEl) {
                if (!textOf(el, ".store_list_address") && store.address) {
                    infoEl.insertAdjacentHTML("beforeend", '<p class="store_list_address">' + store.address + "</p>");
                }
                if (!textOf(el, ".store_list_phone") && store.phone) {
                    infoEl.insertAdjacentHTML("beforeend", '<p class="store_list_phone">' + store.phone + "</p>");
                }
            }
            stores.push(store);
        });
        state.stores = stores;
        updateCount(stores.length);
        return stores;
    }

    function updateCount(n) {
        var el = document.getElementById("storeSearchCount");
        if (el) el.textContent = String(n);
    }

    // ============================================================
    // 상세(view) fetch → 주소 등 보충
    // ============================================================
    function fetchStoreDetail(store, cb) {
        if (store._detailed || !store.viewUrl || typeof window.fetch !== "function") {
            cb();
            return;
        }
        window
            .fetch(store.viewUrl, { credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (html) {
                try {
                    var doc = new DOMParser().parseFromString(html, "text/html");
                    var body = doc.querySelector(".board_view_content .seem_cont") || doc.querySelector(".seem_cont");
                    if (body) applyLabels(store, parseContentLabels(body.innerHTML));
                } catch (e) {}
                store._detailed = true;
                cb();
            })
            .catch(function () { store._detailed = true; cb(); });
    }

    function resolveCoords(store, cb) {
        if (store.lat != null && store.lng != null) { cb(); return; }
        if (!window.naver || !naver.maps || !naver.maps.Service) { cb(); return; }
        naver.maps.Service.geocode({ query: store.address }, function (status, res) {
            if (status === naver.maps.Service.Status.OK && res.v2.addresses.length) {
                store.lat = parseFloat(res.v2.addresses[0].y);
                store.lng = parseFloat(res.v2.addresses[0].x);
            } else {
                console.warn("[professional/store] 지오코딩 실패: " + store.address);
            }
            cb();
        });
    }

    // 좌표 확보(있으면 즉시, 없으면 상세 fetch→지오코딩)
    function ensureStoreCoords(store, cb) {
        if (store.lat != null && store.lng != null) { cb(); return; }
        fetchStoreDetail(store, function () { resolveCoords(store, cb); });
    }

    // ============================================================
    // 지도
    // ============================================================
    function initMap() {
        var container = document.getElementById("naverMapContainer");
        if (!container || !window.naver || !naver.maps) {
            console.error("[professional/store] 네이버 지도 미로드");
            return;
        }
        state.map = new naver.maps.Map(container, {
            center: new naver.maps.LatLng(37.5665, 126.978), // 기본 서울시청
            zoom: 12,
            mapTypeControl: false,
            zoomControl: true,
        });
        state.bounds = new naver.maps.LatLngBounds();
    }

    function addMarker(store) {
        if (store.lat == null || store.lng == null || !state.map) return;
        var pos = new naver.maps.LatLng(store.lat, store.lng);
        store.marker = new naver.maps.Marker({ position: pos, map: state.map, title: store.name });
        naver.maps.Event.addListener(store.marker, "click", function () {
            selectStore(store.index);
        });
        if (state.bounds) state.bounds.extend(pos);
        state.placedCount++;
    }

    function loadAllMarkers() {
        var pending = state.stores.length;
        if (!pending || !state.map) return;
        state.stores.forEach(function (store) {
            ensureStoreCoords(store, function () {
                addMarker(store);
                pending--;
                // 네이버 LatLngBounds 엔 isEmpty() 가 없음 → 실제 마커 수로 판단
                if (pending === 0 && state.placedCount > 0) {
                    state.map.fitBounds(state.bounds);
                }
            });
        });
    }

    // ============================================================
    // 선택/하이라이트
    // ============================================================
    function selectStore(index) {
        var store = state.stores[index];
        if (!store) return;
        state.activeIndex = index;

        state.stores.forEach(function (s) {
            if (s.el) s.el.classList.toggle("is-active", s.index === index);
        });

        if (store.el && store.el.scrollIntoView) {
            store.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        if (store.lat != null && state.map) {
            state.map.setCenter(new naver.maps.LatLng(store.lat, store.lng));
            state.map.setZoom(15);
        } else if (!store._detailed) {
            // 아직 좌표 없으면 확보 후 이동
            ensureStoreCoords(store, function () {
                if (store.lat != null && state.map) {
                    if (!store.marker) addMarker(store);
                    state.map.setCenter(new naver.maps.LatLng(store.lat, store.lng));
                    state.map.setZoom(15);
                }
            });
        }
    }

    function bindListItems() {
        state.stores.forEach(function (store) {
            if (!store.el) return;
            store.el.addEventListener("click", function () {
                selectStore(store.index);
            });
        });
    }

    // ============================================================
    // 검색 (리스트 + 마커 show/hide)
    // ============================================================
    function setupSearch() {
        var input = document.getElementById("storeSearchInput");
        var btn = document.getElementById("btnStoreSearch");
        var clear = document.getElementById("btnStoreClear");

        var apply = function () {
            var kw = (input ? input.value : "").trim().toLowerCase();
            var shown = 0;
            var visPlaced = 0;
            var visBounds = new naver.maps.LatLngBounds();
            state.stores.forEach(function (s) {
                var hay = (s.name + " " + (s.category || "") + " " + (s.address || "")).toLowerCase();
                var match = !kw || hay.indexOf(kw) !== -1;
                if (s.el) s.el.style.display = match ? "" : "none";
                if (s.marker) s.marker.setMap(match ? state.map : null);
                if (match) {
                    shown++;
                    if (s.lat != null) {
                        visBounds.extend(new naver.maps.LatLng(s.lat, s.lng));
                        visPlaced++;
                    }
                }
            });
            updateCount(shown);
            if (state.map && visPlaced > 0) state.map.fitBounds(visBounds);
        };

        if (btn) btn.addEventListener("click", apply);
        if (input) {
            input.addEventListener("keydown", function (e) {
                if (e.key === "Enter") { e.preventDefault(); apply(); }
            });
        }
        if (clear) {
            clear.addEventListener("click", function () {
                if (input) input.value = "";
                apply();
            });
        }
    }

    // ============================================================
    // 게시판 목록 AJAX 로드 (includeWidget 대체) → #storeList 채움
    // /board/list.php?bdId=... 를 불러와 tr[data-sno] 파싱
    // ============================================================
    function fetchBoardList(bdid, cb) {
        var listEl = document.getElementById("storeList");
        if (!bdid || typeof window.fetch !== "function") { cb(); return; }
        window
            .fetch("/board/list.php?bdId=" + encodeURIComponent(bdid), { credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (html) {
                try {
                    var doc = new DOMParser().parseFromString(html, "text/html");
                    // 라이브 목록엔 data-sno 가 없고 제목 링크가 gd_btn_view('bdId', SNO ...) 형태.
                    // 제목 셀(.board_tit)의 링크에서 sno 추출 (sno 중복 제거).
                    var links = doc.querySelectorAll(".board_tit a");
                    var seen = {};
                    var out = "";
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
                        out +=
                            '<li class="store_list_item" data-sno="' + sno + '"' +
                            ' data-name="' + name.replace(/"/g, "&quot;") + '"' +
                            ' data-view-url="/board/view.php?bdId=' + bdid + "&sno=" + sno + '">' +
                            '<div class="store_list_info"><p class="store_list_name">' + name + "</p></div>" +
                            '<span class="store_list_arrow" aria-hidden="true">&rsaquo;</span>' +
                            "</li>";
                    });
                    if (listEl) listEl.innerHTML = out || '<li class="store_list_empty">등록된 매장이 없습니다.</li>';
                } catch (e) {
                    console.warn("[professional/store] 게시판 목록 파싱 실패", e);
                }
                cb();
            })
            .catch(function () { cb(); });
    }

    // ============================================================
    // 초기화
    // ============================================================
    document.addEventListener("DOMContentLoaded", function () {
        var listEl = document.getElementById("storeList");
        var bdid = listEl ? listEl.getAttribute("data-bdid") : "";
        fetchBoardList(bdid, function () {
            buildStoresFromDOM();
            initMap();
            loadAllMarkers();
            bindListItems();
            setupSearch();
        });
    });

    window.professional.store = {
        getState: function () { return state; },
        selectStore: selectStore,
        buildStoresFromDOM: buildStoresFromDOM,
    };
})(window);
