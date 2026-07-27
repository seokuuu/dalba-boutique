// -------------------------------
// 상품 캐러셀 초기화 함수
// -------------------------------
function initProductCarousel() {
    var productElem = document.querySelector(".product_carousel");
    var visualElem = document.querySelector(".visual_carousel");
    if (!productElem || !visualElem || !window.Flickity) {
        return;
    }
    var productFlkty = new Flickity(productElem, {
        wrapAround: true,
        cellAlign: "center",
        // contain: true,
        fade: true,
    });
    var visualFlkty = new Flickity(visualElem, {
        asNavFor: productElem,
        // contain: true,
        wrapAround: true,
        cellAlign: "center",
        prevNextButtons: false,
        pageDots: false,
        draggable: false,
        // fade: true,
    });
    // 동적 높이 동기화: 선택된 셀의 실제 콘텐츠 높이로 viewport 높이 갱신
    var rafId = null;
    var syncVisualViewportHeight = function () {
        if (!visualFlkty || !visualFlkty.viewport) return;
        var selectedEl = visualFlkty.selectedElement;
        if (!selectedEl) return;
        var newHeight = selectedEl.offsetHeight || selectedEl.scrollHeight || 0;
        if (newHeight > 0) {
            visualFlkty.viewport.style.height = newHeight + "px";
        }
    };
    var scheduleSyncHeight = function () {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(syncVisualViewportHeight);
    };
    visualFlkty.on("ready", scheduleSyncHeight);
    visualFlkty.on("select", scheduleSyncHeight);
    // 이미지 로드 후에도 다시 계산
    var visualImages = visualElem.querySelectorAll("img");
    if (visualImages && visualImages.length) {
        for (var i = 0; i < visualImages.length; i++) {
            var img = visualImages[i];
            if (img.complete) continue;
            img.addEventListener("load", scheduleSyncHeight, {
                once: true,
            });
        }
    }
    // 브라우저 리사이즈 시 동적 반영
    window.addEventListener("resize", scheduleSyncHeight);
    // Ensure sync even if asNavFor misses an edge case
    productFlkty.on("select", function () {
        if (visualFlkty.selectedIndex !== productFlkty.selectedIndex) {
            visualFlkty.select(productFlkty.selectedIndex);
        }
        scheduleSyncHeight();
    });
    // Mobile-only pager + next button UI
    var mobileUi = document.querySelector(".mobile_carousel_ui");
    if (mobileUi) {
        var currentEl = mobileUi.querySelector(".current");
        var totalEl = mobileUi.querySelector(".total");
        var nextBtn = mobileUi.querySelector(".mobile_carousel_button.next");
        var previousBtn = mobileUi.querySelector(".mobile_carousel_button.previous");
        var setTotal = function () {
            var total = (productFlkty && productFlkty.slides && productFlkty.slides.length) || 0;
            if (totalEl) totalEl.textContent = String(total);
        };
        var updateCurrent = function () {
            if (currentEl) {
                currentEl.textContent = String(productFlkty.selectedIndex + 1);
            }
        };
        setTotal();
        updateCurrent();
        productFlkty.on("select", updateCurrent);
        if (nextBtn) {
            nextBtn.addEventListener("click", function () {
                productFlkty.next(true);
            });
        }
        if (previousBtn) {
            previousBtn.addEventListener("click", function () {
                productFlkty.previous(true);
            });
        }
    }
}

// ============================================================
// 캐러셀 관련 함수
// ============================================================
function generateStoreCarouselItem(store) {
    var timeHtml = store.time.replace(/\n/g, "<br />");
    return `
        <div class="carousel-cell reserve_carousel_cell">
            <h4 class="store_title">${store.name}</h4>
            <div class="store_address">${store.address}</div>
            <div class="store-info">
                <div class="store-info_item">
                    <div class="store-info_icon phone">
                        <img src="/data/img/product/detail/signature/icon_info_phone.svg" class="store-info_icon_image" alt="전화 문의" />
                        <span class="sr-only">전화 문의</span>
                    </div>
                    <div class="store-info_text">${store.phone}</div>
                </div>
                <div class="store-info_item">
                    <div class="store-info_icon holiday">
                        <img src="/data/img/product/detail/signature/icon_info_map.svg" class="store-info_icon_image" alt="휴점 안내" />
                        <span class="sr-only">휴점 안내</span>
                    </div>
                    <div class="store-info_text">${store.holiday}</div>
                </div>
            </div>
            <div class="store_time">${timeHtml}</div>
        </div>
    `;
}
function setupReserveCarousel(storeData, state) {
    var carouselElem = document.getElementById("reserveCarousel");
    if (!carouselElem || !window.Flickity) return;

    // storeData를 기반으로 캐러셀 아이템 생성
    var carouselHtml = "";
    for (var i = 0; i < storeData.length; i++) {
        carouselHtml += generateStoreCarouselItem(storeData[i]);
    }
    carouselElem.innerHTML = carouselHtml;

    // Flickity 초기화
    state.reserveFlkty = new Flickity(carouselElem, {
        wrapAround: true,
        cellAlign: "center",
        fade: true,
        pageDots: false,
    });

    // 캐러셀 UI 업데이트
    var carouselUi = document.querySelector("#reserve .mobile_carousel_ui");
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

function setupReserveToggle(state) {
    var toggleBtn = document.getElementById("reserveToggleBtn");
    var panel = document.getElementById("reserve");
    if (!toggleBtn || !panel) return;

    toggleBtn.addEventListener("click", function () {
        console.log("toggleBtn clicked");
        var isOpen = panel.classList.toggle("open");
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        panel.setAttribute("aria-hidden", isOpen ? "false" : "true");

        // 패널이 열릴 때 캐러셀 초기화 (아직 초기화되지 않았다면)
        if (isOpen && !state.reserveFlkty) {
            setupReserveCarousel();
        } else if (isOpen && state.reserveFlkty) {
            // 이미 초기화된 경우 리사이즈
            state.reserveFlkty.resize();
        }
    });
}
// -------------------------------
// 초기화 엔트리 포인트
// -------------------------------
document.addEventListener("DOMContentLoaded", function () {
    var store = window.signature && window.signature.store;

    if (store) {
        initProductCarousel();
        setupReserveCarousel(store.data, store.getState());
        setupReserveToggle(store.getState());
        store.setupReserveModal();
    }
});
