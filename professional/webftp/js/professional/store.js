// ============================================================
// Store Module (PROFESSIONAL) - 게시판 연동 + 검색 + 지도
// ------------------------------------------------------------
// 매장 데이터 출처: 고도몰 매장 게시판 → 커스텀 list 스킨이 아래 형태로 렌더한 DOM
//   <li class="store_list_item"
//       data-name="매장명" data-address="주소" data-phone="전화"
//       data-hours="월요일 10:00-20:00;화요일 10:00-20:00;..."   (구분자 ; 또는 |)
//       data-image="이미지URL"
//       data-lat="37.5" data-lng="127.0">   ← 좌표는 선택(없으면 주소 지오코딩)
//     ...
//     <button class="reserve-modal_button">지도에서 보기</button>
//   </li>
// store.js 는 이 DOM 을 파싱(buildStoreDataFromDOM)해 검색/지도/모달을 구동.
// 좌표: data-lat/lng 있으면 사용, 없으면 naver.maps.Service.geocode(주소) 로 변환
//   → store.html 의 maps.js 에 &submodules=geocoder 필요.
// signature store.js(캐러셀+하드코딩) 의 지도/모달 로직을 계승, 데이터원만 게시판 DOM 으로 교체.
// ============================================================

(function (window) {
    window.professional = window.professional || {};
    if (window.professional.store) return;

    var state = {
        naverMapInstance: null,
        naverMapMarker: null,
        isMapInitialized: false,
        stores: [], // { el, index, name, address, phone, image, hoursLines:[{day,time}], lat, lng }
        currentStore: null,
    };

    // ============================================================
    // DOM 파싱 (게시판 스킨이 렌더한 #storeList 를 storeData 로)
    // ============================================================
    function parseHours(raw) {
        if (!raw) return [];
        return raw
            .split(/\s*[;|\n]\s*/)
            .filter(function (s) {
                return s;
            })
            .map(function (line) {
                // "월요일 10:00-20:00" → {day:"월요일", time:"10:00-20:00"}. 구분 안되면 통째로.
                var idx = line.indexOf(" ");
                if (idx > 0) return { day: line.slice(0, idx), time: line.slice(idx + 1) };
                return { day: line, time: "" };
            });
    }

    // 게시판 본문(내용) 라벨 파싱 — 구조화 필드가 없으므로 본문에 라벨로 입력:
    //   주소: ... / 전화: ... / 영업시간: 월-금 10:00-20:00;토 10:00-18:00 / 좌표: 37.5,127.0
    // (게시판 "에디터 사용안함" 권장 → 본문이 평문이라 파싱 안정적)
    function parseContentLabels(raw) {
        var out = {};
        if (!raw) return out;
        var text = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""); // 혹시 있을 태그 제거
        text.split(/\n+/).forEach(function (line) {
            line = line.trim();
            var m;
            if ((m = line.match(/^주소\s*[:：]\s*(.+)$/))) out.address = m[1].trim();
            else if ((m = line.match(/^(?:전화|전화번호|연락처)\s*[:：]\s*(.+)$/))) out.phone = m[1].trim();
            else if ((m = line.match(/^영업시간\s*[:：]\s*(.+)$/))) out.hours = m[1].trim();
            else if ((m = line.match(/^좌표\s*[:：]\s*([\d.]+)\s*,\s*([\d.]+)$/))) {
                out.lat = parseFloat(m[1]);
                out.lng = parseFloat(m[2]);
            }
        });
        return out;
    }

    function textOf(el, selector) {
        var node = el.querySelector(selector);
        return node ? node.textContent.trim() : "";
    }

    function buildStoreDataFromDOM() {
        var items = document.querySelectorAll("#storeList .store_list_item");
        var stores = [];
        Array.prototype.forEach.call(items, function (el, i) {
            var lat = parseFloat(el.getAttribute("data-lat"));
            var lng = parseFloat(el.getAttribute("data-lng"));
            var store = {
                el: el,
                index: i,
                name: el.getAttribute("data-name") || textOf(el, ".store_list_name"),
                address: el.getAttribute("data-address") || textOf(el, ".store_list_address"),
                phone: el.getAttribute("data-phone") || textOf(el, ".store_list_phone"),
                image: el.getAttribute("data-image") || "",
                hoursLines: parseHours(el.getAttribute("data-hours")),
                lat: isNaN(lat) ? null : lat,
                lng: isNaN(lng) ? null : lng,
            };

            // data-* 로 안 채워진 값은 게시판 본문(data-content) 라벨에서 보충
            var labels = parseContentLabels(el.getAttribute("data-content"));
            if (!store.address && labels.address) store.address = labels.address;
            if (!store.phone && labels.phone) store.phone = labels.phone;
            if (!store.hoursLines.length && labels.hours) store.hoursLines = parseHours(labels.hours);
            if (store.lat == null && labels.lat != null) {
                store.lat = labels.lat;
                store.lng = labels.lng;
            }

            // 리스트에 보이는 정보 보강 (게시판 스킨이 제목+본문만 줘도 주소/전화 노출)
            var infoEl = el.querySelector(".store_list_info");
            if (infoEl) {
                if (!textOf(el, ".store_list_name") && store.name) {
                    infoEl.insertAdjacentHTML("afterbegin", '<p class="store_list_name">' + store.name + "</p>");
                }
                if (!textOf(el, ".store_list_address") && store.address) {
                    infoEl.insertAdjacentHTML("beforeend", '<p class="store_list_address">' + store.address + "</p>");
                }
                if (!textOf(el, ".store_list_phone") && store.phone) {
                    infoEl.insertAdjacentHTML("beforeend", '<p class="store_list_phone">' + store.phone + "</p>");
                }
            }

            var btn = el.querySelector(".reserve-modal_button");
            if (btn) btn.setAttribute("data-store-index", String(i));
            stores.push(store);
        });
        state.stores = stores;
        updateCount(stores.length);
        return stores;
    }

    function updateCount(n) {
        var countElem = document.getElementById("storeSearchCount");
        if (countElem) countElem.textContent = String(n);
    }

    // ============================================================
    // 검색 (게시판 렌더 DOM 보존 → show/hide 필터)
    // ============================================================
    function setupSearch() {
        var input = document.getElementById("storeSearchInput");
        var btn = document.getElementById("btnStoreSearch");

        var doSearch = function () {
            var kw = (input ? input.value : "").trim().toLowerCase();
            var shown = 0;
            state.stores.forEach(function (s) {
                var match =
                    !kw ||
                    s.name.toLowerCase().indexOf(kw) !== -1 ||
                    s.address.toLowerCase().indexOf(kw) !== -1;
                s.el.style.display = match ? "" : "none";
                if (match) shown++;
            });
            updateCount(shown);
        };

        if (btn) btn.addEventListener("click", doSearch);
        if (input) {
            input.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    doSearch();
                }
            });
        }
    }

    // ============================================================
    // 좌표 확보 (data 좌표 우선, 없으면 주소 지오코딩)
    // ============================================================
    function resolveCoords(store, cb) {
        if (store.lat != null && store.lng != null) {
            cb(store.lat, store.lng);
            return;
        }
        if (!window.naver || !naver.maps || !naver.maps.Service) {
            console.error("[professional/store] 네이버 지오코더 미로드 — maps.js 에 &submodules=geocoder 필요");
            cb(null, null);
            return;
        }
        naver.maps.Service.geocode({ query: store.address }, function (status, response) {
            if (status !== naver.maps.Service.Status.OK || !response.v2.addresses.length) {
                console.warn("[professional/store] 지오코딩 실패: " + store.address);
                cb(null, null);
                return;
            }
            var addr = response.v2.addresses[0];
            store.lat = parseFloat(addr.y); // 캐싱
            store.lng = parseFloat(addr.x);
            cb(store.lat, store.lng);
        });
    }

    // ============================================================
    // 네이버 지도
    // ============================================================
    function renderMap(lat, lng, title) {
        var mapContainer = document.getElementById("naverMapContainer");
        if (!mapContainer || !window.naver || !naver.maps) return;

        var latlng = new naver.maps.LatLng(lat, lng);

        if (!state.isMapInitialized) {
            state.naverMapInstance = new naver.maps.Map(mapContainer, {
                center: latlng,
                zoom: 16,
                mapTypeControl: false,
                zoomControl: true,
            });
            state.naverMapMarker = new naver.maps.Marker({
                position: latlng,
                map: state.naverMapInstance,
                title: title,
            });
            mapContainer.classList.add("has-map");
            state.isMapInitialized = true;
        } else {
            state.naverMapInstance.setCenter(latlng);
            state.naverMapMarker.setPosition(latlng);
            state.naverMapMarker.setTitle(title);
        }

        setTimeout(function () {
            naver.maps.Event.trigger(state.naverMapInstance, "resize");
            state.naverMapInstance.setCenter(latlng);
        }, 300);
    }

    // ============================================================
    // 모달
    // ============================================================
    function updateReserveModalInfo(store) {
        var titleEl = document.getElementById("reserveModalTitle");
        var addressEl = document.getElementById("reserveModalAddress");
        var openingHoursEl = document.getElementById("reserveModalOpeningHours");
        var phoneBtnEl = document.getElementById("reserveModalPhoneBtn");

        if (titleEl) titleEl.textContent = store.name;
        if (addressEl) addressEl.textContent = store.address;
        if (phoneBtnEl) phoneBtnEl.textContent = store.phone;

        if (openingHoursEl) {
            openingHoursEl.innerHTML = store.hoursLines
                .map(function (h) {
                    return (
                        '<li class="opening-hours_item">' +
                        '<span class="opening-hours_day">' + h.day + "</span>" +
                        '<span class="opening-hours_time">' + h.time + "</span>" +
                        "</li>"
                    );
                })
                .join("");
        }
    }

    function openReserveModal(store) {
        var overlay = document.getElementById("reserveModalOverlay");
        if (!overlay) return;

        state.currentStore = store;
        updateReserveModalInfo(store);

        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        var mapContainer = document.getElementById("naverMapContainer");
        resolveCoords(store, function (lat, lng) {
            if (lat == null || lng == null) {
                // 좌표 확보 실패 → 지도 영역 안내
                if (mapContainer) mapContainer.setAttribute("data-map-error", "지도 정보를 불러올 수 없습니다.");
                return;
            }
            if (mapContainer) mapContainer.removeAttribute("data-map-error");
            renderMap(lat, lng, store.name);
        });
    }

    function closeReserveModal() {
        var overlay = document.getElementById("reserveModalOverlay");
        if (!overlay) return;
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "initial";
    }

    function setupReserveModal() {
        var closeBtn = document.getElementById("closeReserveModalButton");
        var overlay = document.getElementById("reserveModalOverlay");

        if (closeBtn) closeBtn.addEventListener("click", closeReserveModal);
        if (overlay) {
            overlay.addEventListener("click", function (e) {
                if (e.target === overlay) closeReserveModal();
            });
        }
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay && overlay.classList.contains("open")) closeReserveModal();
        });
    }

    // 리스트 버튼 → 모달 (게시판 렌더 후 1회 바인딩)
    function bindReserveButtons() {
        var btns = document.querySelectorAll("#storeList .reserve-modal_button");
        Array.prototype.forEach.call(btns, function (btn) {
            btn.addEventListener("click", function () {
                var idx = parseInt(this.getAttribute("data-store-index"), 10);
                var store = state.stores[idx];
                if (store) openReserveModal(store);
            });
        });
    }

    // ============================================================
    // 초기화
    // ============================================================
    document.addEventListener("DOMContentLoaded", function () {
        buildStoreDataFromDOM(); // 게시판이 렌더한 #storeList 파싱
        setupSearch();
        bindReserveButtons();
        setupReserveModal();
    });

    // ============================================================
    // 네임스페이스
    // ============================================================
    window.professional.store = {
        getState: function () {
            return state;
        },
        buildStoreDataFromDOM: buildStoreDataFromDOM,
        openReserveModal: openReserveModal,
        closeReserveModal: closeReserveModal,
    };
})(window);
