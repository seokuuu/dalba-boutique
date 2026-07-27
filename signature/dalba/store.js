// ============================================================
// Store Module - 매장 데이터 및 관련 기능
// ============================================================
// Note: 새로운 매장을 추가하려면, 각 매장 객체에 다음과 같은 정보를 포함해야 합니다:
// 배열의 순서는 매장 방문 예약하기 캐러셀의 순서와 동일합니다.
// {
//     name: "매장명",
//     image: "매장 이미지 경로",
//     address: "매장 주소",
//     phone: "매장 전화번호",
//     holiday: "휴점일 또는 연중무휴 등",
//     time: "운영 시간 설명",
//     openingHours: [
//         { day: "요일", time: "운영 시간" },
//         ... (월~일요일까지 추가)
//     ],
//     latitude: 위도값 (숫자),
//     longitude: 경도값 (숫자)
// }
// ============================================================

(function (window) {
    window.signature = window.signature || {};
    if (window.signature.store) return;

    // ============================================================
    // 매장 데이터
    // ============================================================
    var storeData = [
        {
            name: "현대백화점 목동점",
            image: "/data/img/signature/store/store_mokdong.jpg",
            address: "서울 양천구 목동동로 257\n 현대백화점 목동점 본관 1층",
            phone: "02-2163-1157",
            holiday: "10월 5-6일 휴점일입니다.",
            time: "월요일 - 목요일 : 10:30 - 20:00\n금요일 - 일요일 : 10:30 - 20:30",
            openingHours: [
                { day: "월요일", time: "10:30 - 20:00" },
                { day: "화요일", time: "10:30 - 20:00" },
                { day: "수요일", time: "10:30 - 20:00" },
                { day: "목요일", time: "10:30 - 20:00" },
                { day: "금요일", time: "10:30 - 20:30" },
                { day: "토요일", time: "10:30 - 20:30" },
                { day: "일요일", time: "10:30 - 20:30" },
            ],
            latitude: 37.527194,
            longitude: 126.874684,
        },
        {
            name: "달바 시그니처 명동점",
            image: "/data/img/signature/store/store_myeongdong.jpg",
            address: "서울 중구 명동길 48 시코르 명동점 1층\n 달바 시그니처 스토어",
            phone: "0507-1349-1143",
            holiday: "연중무휴",
            time: "매일 : 11:00 - 23:30",
            openingHours: [
                { day: "월요일", time: "11:00 - 23:00" },
                { day: "화요일", time: "11:00 - 23:00" },
                { day: "수요일", time: "11:00 - 23:00" },
                { day: "목요일", time: "11:00 - 23:00" },
                { day: "금요일", time: "11:00 - 23:00" },
                { day: "토요일", time: "11:00 - 23:00" },
                { day: "일요일", time: "11:00 - 23:00" },
            ],
            latitude: 37.563673,
            longitude: 126.985004,
        },
        {
            name: "달바 시그니처 홍대점",
            image: "/data/img/signature/store/store_hongdae.jpg",
            address: "서울특별시 마포구 홍익로6길 56 시코르 홍대점 1층\n 달바 시그니처 스토어",
            phone: "02-336-1135",
            holiday: "연중무휴",
            time: "매일 : 11:00 - 23:30",
            openingHours: [
                { day: "월요일", time: "11:00 - 23:30" },
                { day: "화요일", time: "11:00 - 23:30" },
                { day: "수요일", time: "11:00 - 23:30" },
                { day: "목요일", time: "11:00 - 23:30" },
                { day: "금요일", time: "11:00 - 23:30" },
                { day: "토요일", time: "11:00 - 23:30" },
                { day: "일요일", time: "11:00 - 23:30" },
            ],
            latitude: 37.556354,
            longitude: 126.924516,
        },
		{
            name: "달바 시그니처 강남역점",
            image: "/data/img/signature/store/store_gangnam.jpeg",
            address: "서울특별시 강남구 강남대로 408 시코르 강남역점 1층\n 달바 시그니처 스토어",
            phone: "070-7714-2728",
            holiday: "연중무휴",
            time: "매일 : 10:30 - 22:30",
            openingHours: [
                { day: "월요일", time: "10:30 - 22:30" },
                { day: "화요일", time: "10:30 - 22:30" },
                { day: "수요일", time: "10:30 - 22:30" },
                { day: "목요일", time: "10:30 - 22:30" },
                { day: "금요일", time: "10:30 - 22:30" },
                { day: "토요일", time: "10:30 - 22:30" },
                { day: "일요일", time: "10:30 - 22:30" },
            ],
            latitude: 37.4991081,
            longitude: 127.0274516,
        },
    ];

    // ============================================================
    // 내부 상태 관리
    // ============================================================
    var state = {
        naverMapInstance: null,
        naverMapMarker: null,
        isMapInitialized: false,
        currentStoreIndex: 0,
        reserveFlkty: null,
    };

    function createItem(target, storeData, generateFunction) {
        var listElem = document.querySelector(target);
        if (!listElem) return;
    
        // storeData를 기반으로 캐러셀 아이템 생성
        var itemHTML = "";
        for (var i = 0; i < storeData.length; i++) {
            itemHTML += generateFunction(storeData[i], i);
        }
        listElem.innerHTML = itemHTML;
    
    }

    function setupCarousel(target) {
        var carouselElem = document.querySelector(target);
        if (!carouselElem || !window.Flickity) return;
    
        // Flickity 초기화
        state.reserveFlkty = new Flickity(carouselElem, {
            wrapAround: true,
            cellAlign: "center",
            fade: true,
            pageDots: false,
        });
    
        // 캐러셀 UI 업데이트
        var carouselUi = carouselElem.parentNode.querySelector(".mobile_carousel_ui");
        if (carouselUi) {
            var currentEl = carouselUi.querySelector(".current");
            var totalEl = carouselUi.querySelector(".total");
            var nextBtn = carouselUi.querySelector(".mobile_carousel_button.next");
            var previousBtn = carouselUi.querySelector(".mobile_carousel_button.previous");
    
            // 총 개수 설정
            if (totalEl) totalEl.textContent = String(storeData.length);
    
            // 현재 인덱스 업데이트
            var updateCurrent = function () {
                if (currentEl) {
                    currentEl.textContent = String(state.reserveFlkty.selectedIndex + 1);
                }
                state.currentStoreIndex = state.reserveFlkty.selectedIndex;
            };
            updateCurrent();
            state.reserveFlkty.on("select", updateCurrent);
    
            // 이전/다음 버튼
            if (nextBtn) {
                nextBtn.addEventListener("click", function () {
                    state.reserveFlkty.next(true);
                });
            }
            if (previousBtn) {
                previousBtn.addEventListener("click", function () {
                    state.reserveFlkty.previous(true);
                });
            }
        }
    }

    function destroyCarousel(target) {
        var carouselElem = document.querySelector(target);
        if (!carouselElem || !window.Flickity || !state.reserveFlkty) return;
        state.reserveFlkty.destroy();
        state.reserveFlkty = null;
    }

    // ============================================================
    // 네이버 지도 관련 함수
    // ============================================================
    function initNaverMap(storeIndex) {
        if (typeof storeIndex === "undefined") storeIndex = state.currentStoreIndex;
        var store = storeData[storeIndex];
        if (!store) return;

        if (!window.naver || !naver.maps) {
            console.error("네이버 지도 API를 불러오지 못했습니다.");
            return;
        }

        var mapContainer = document.getElementById("naverMapContainer");
        if (!mapContainer) return;

        var mallLatLng = new naver.maps.LatLng(store.latitude, store.longitude);

        if (!state.isMapInitialized) {
            // 지도 기본 옵션
            state.naverMapInstance = new naver.maps.Map(mapContainer, {
                center: mallLatLng,
                zoom: 16,
                mapTypeControl: false,
                zoomControl: true,
            });

            // 지도 색상(세피아 톤) 스타일
            var sepiaMapStyles = [
                {
                    featureType: "all",
                    elementType: "all",
                    stylers: [{ hue: "#c8a16a" }, { saturation: -60 }, { lightness: 10 }],
                },
            ];

            state.naverMapInstance.setOptions("mapStyles", sepiaMapStyles);

            // 마커 생성
            state.naverMapMarker = new naver.maps.Marker({
                position: mallLatLng,
                map: state.naverMapInstance,
                title: store.name,
            });

            mapContainer.classList.add("has-map");
            state.isMapInitialized = true;
        } else {
            // 지도와 마커 위치 업데이트
            state.naverMapInstance.setCenter(mallLatLng);
            if (state.naverMapMarker) {
                state.naverMapMarker.setPosition(mallLatLng);
                state.naverMapMarker.setTitle(store.name);
            }
        }
    }

    // ============================================================
    // 모달 관련 함수
    // ============================================================
    function updateReserveModalInfo(storeIndex) {
        var store = storeData[storeIndex];
        if (!store) return;

        var titleEl = document.getElementById("reserveModalTitle");
        var addressEl = document.getElementById("reserveModalAddress");
        var storeTagEl = document.querySelector(".reserve-modal_tag.store_tag");
        var openingHoursEl = document.getElementById("reserveModalOpeningHours");
        var phoneBtnEl = document.getElementById("reserveModalPhoneBtn");

        if (titleEl) titleEl.textContent = store.name;
        if (addressEl) addressEl.textContent = store.address;
        if (phoneBtnEl) phoneBtnEl.textContent = store.phone;

        if (!storeTagEl && store.tag) {
            var newTagEl = document.createElement("div");
            newTagEl.className = "reserve-modal_tag store_tag";
            newTagEl.textContent = store.tag;
            
            var headEl = document.querySelector(".reserve-modal_head");
            if (headEl) headEl.appendChild(newTagEl);
        } else if (storeTagEl && !store.tag) {
            storeTagEl.remove();
        }
   
        if (openingHoursEl) {
            var hoursHtml = "";
            for (var i = 0; i < store.openingHours.length; i++) {
                var hour = store.openingHours[i];
                hoursHtml +=
                    '<li class="opening-hours_item">' +
                    '<span class="opening-hours_day">' +
                    hour.day +
                    "</span>" +
                    '<span class="opening-hours_time">' +
                    hour.time +
                    "</span>" +
                    "</li>";
            }
            openingHoursEl.innerHTML = hoursHtml;
        }


    }

    function setupReserveModal() {
        var openReserveModalBtns = document.querySelectorAll(".reserve-modal_button");
        var reserveModalOverlay = document.getElementById("reserveModalOverlay");
        var closeReserveModalBtn = document.getElementById("closeReserveModalButton");

        if (!openReserveModalBtns || !reserveModalOverlay || !closeReserveModalBtn) return;

        var mediaQuery = window.matchMedia("(max-width: 690px)");
        var body = document.body;

        // 모바일(≤690px): modal=reserve-map 쿼리 파라미터 기반 동작
        var PARAM_KEY = "modal";
        var PARAM_VALUE = "reserve-map";

        var hasModalParam = function () {
            try {
                var url = new URL(window.location.href);
                return url.searchParams.get(PARAM_KEY) === PARAM_VALUE;
            } catch (e) {
                var search = window.location.search || "";
                return /(?:^|[?&])modal=reserve-map(?:&|$)/.test(search);
            }
        };

        var getBaseUrl = function () {
            try {
                var url = new URL(window.location.href);
                url.searchParams.delete(PARAM_KEY);
                return url.toString();
            } catch (e) {
                var href = window.location.href || "";
                return href
                    .replace(/([?&])modal=[^&]*&?/i, "$1")
                    .replace(/([?&])modal(?=&|$)/i, "$1")
                    .replace(/[?&]$/, "");
            }
        };

        var getReserveUrl = function () {
            try {
                var base = new URL(getBaseUrl());
                base.searchParams.set(PARAM_KEY, PARAM_VALUE);
                return base.toString();
            } catch (e) {
                var baseStr = getBaseUrl();
                return (
                    baseStr +
                    (baseStr.indexOf("?") === -1 ? "?" : "&") +
                    PARAM_KEY +
                    "=" +
                    encodeURIComponent(PARAM_VALUE)
                );
            }
        };

        var syncOverlayByQuery = function () {
            if (mediaQuery.matches) {
                if (hasModalParam()) {
                    body.style.overflow = "hidden";
                    reserveModalOverlay.classList.add("open");
                    reserveModalOverlay.setAttribute("aria-hidden", "false");
                    updateReserveModalInfo(state.currentStoreIndex);
                    initNaverMap(state.currentStoreIndex);
                    if (window.naver && state.naverMapInstance) {
                        setTimeout(function () {
                            naver.maps.Event.trigger(state.naverMapInstance, "resize");
                        }, 300);
                    }
                } else {
                    reserveModalOverlay.classList.remove("open");
                    body.style.overflow = "initial";
                    reserveModalOverlay.setAttribute("aria-hidden", "true");
                }
            } else {
                if (hasModalParam()) {
                    try {
                        var baseUrl = getBaseUrl();
                        history.replaceState({ modal: null }, "", baseUrl);
                    } catch (e) {
                        // noop
                    }
                }
            }
        };

        window.addEventListener("popstate", syncOverlayByQuery);

        // 버튼 클릭
        openReserveModalBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                updateReserveModalInfo(state.currentStoreIndex);

                if (mediaQuery.matches) {
                    if (!hasModalParam()) {
                        try {
                            history.pushState({ modal: PARAM_VALUE }, "", getReserveUrl());
                        } catch (e) {
                            // noop
                        }
                    }
                    syncOverlayByQuery();
                } else {
                    reserveModalOverlay.classList.toggle("open");
                    reserveModalOverlay.setAttribute(
                        "aria-hidden",
                        reserveModalOverlay.classList.contains("open") ? "false" : "true"
                    );
                    if (reserveModalOverlay.classList.contains("open")) {
                        initNaverMap(state.currentStoreIndex);
                        if (window.naver && state.naverMapInstance) {
                            setTimeout(function () {
                                naver.maps.Event.trigger(state.naverMapInstance, "resize");
                            }, 300);
                        }
                    }
                }
            });
        });

        // 모달 닫기 버튼
        closeReserveModalBtn.addEventListener("click", function () {
            reserveModalOverlay.classList.remove("open");
            reserveModalOverlay.setAttribute("aria-hidden", "true");
            body.style.overflow = "initial";
        });

        // 오버레이 배경 클릭 시 닫기
        reserveModalOverlay.addEventListener("click", function (event) {
            if (event.target === reserveModalOverlay) {
                reserveModalOverlay.classList.remove("open");
                reserveModalOverlay.setAttribute("aria-hidden", "true");
                body.style.overflow = "initial";
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && reserveModalOverlay.classList.contains("open")) {
                reserveModalOverlay.classList.remove("open");
                reserveModalOverlay.setAttribute("aria-hidden", "true");
                body.style.overflow = "initial";
            }
        });

        // 초기 로드 시(모바일) 현재 쿼리파라미터 상태 반영
        syncOverlayByQuery();
    }

    // ============================================================
    // 네임스페이스에 등록
    // ============================================================
    window.signature.store = {
        // 데이터
        data: storeData,

        // 상태 접근자
        getState: function () {
            return state;
        },
        setCurrentStoreIndex: function (index) {
            state.currentStoreIndex = index;
        },
        getCurrentStoreIndex: function () {
            return state.currentStoreIndex;
        },
        getReserveFlkty: function () {
            return state.reserveFlkty;
        },

        // 초기화 함수
        initNaverMap,
        updateReserveModalInfo,
        createItem,
        setupReserveModal,
        setupCarousel,
        destroyCarousel,
    };
})(window);