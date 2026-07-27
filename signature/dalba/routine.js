(function (window) {
    const signature = window.signature || null;
    if (!signature) {
        console.error("[signature/routine.js] signature not found!");
        return;
    }

    const initRoutine = () => {
        const elements = {
            survey: document.querySelector("#survey"),
            overview: document.querySelector("#overview"),
            recommend: document.querySelector("#recommend"),
            surveyButton: document.querySelector("#survey-button"),
            root: document.documentElement,
            body: document.body,
        };
        const surveyInputs = document.querySelectorAll('input[name="survey"]');
        const productItems = document.querySelectorAll(".product__item[data-visibility]");
        const productListOne = document.querySelector(".product--1");
        const productListTwo = document.querySelector(".product--2");

        const delay = (ms, fn) => signature.utils.sleep(ms).then(fn);
        const addActive = (el) => el && el.classList.add("active");
        const removeActive = (el) => el && el.classList.remove("active");

        let lastScrollY = window.scrollY;

        const updateRecommendScrollState = () => {
            const currentScrollY = window.scrollY;
            const isForward = currentScrollY >= lastScrollY;
            lastScrollY = currentScrollY;

            if (window.matchMedia("(min-width: 601px)").matches) {
                if (!elements.recommend) return;
                const { scrollTop, scrollHeight, clientHeight, offsetHeight } = elements.recommend;
                const maxScroll = Math.max(scrollHeight - clientHeight, 0);
                let ratio = 0;

                if (maxScroll > 0) {
                    ratio = scrollTop / maxScroll;
                } else {
                    const rect = elements.recommend.getBoundingClientRect();
                    const elementTop = rect.top + window.scrollY;
                    const start = elementTop;
                    const end = elementTop + offsetHeight - window.innerHeight;
                    const range = Math.max(end - start, 0);
                    ratio = range === 0 ? 0 : (currentScrollY - start) / range;
                }

                ratio = Math.min(Math.max(ratio, 0), 1);

                if (productListTwo && productListOne) {
                    const fadeTop = Math.min(ratio / 0.5, 1);
                    productListOne.style.setProperty("--fade-top", 1 - ratio);
                    productListTwo.style.setProperty("--fade-bottom", ratio);
                }
            }


            if (window.matchMedia("(max-width: 600px)").matches) {
                const productItemsWithoutHidden = Array.from(productItems).filter((item) => !item.hidden);
                if (productItemsWithoutHidden.length) {
                    const viewportCenter = currentScrollY + window.innerHeight * 0.8;
                    let activeIndex = 0;

                    productItemsWithoutHidden.forEach((item, index) => {
                        const rect = item.getBoundingClientRect();
                        const itemTop = isForward ? rect.top + currentScrollY : rect.bottom + currentScrollY;

                        if (itemTop <= viewportCenter) {
                            activeIndex = index;
                        }
                    });

                    productItemsWithoutHidden.forEach((item, index) => {
                        item.classList.toggle("previous", index === activeIndex - 1);
                        item.classList.toggle("current", index === activeIndex);
                        item.classList.toggle("next", index === activeIndex + 1);
                    });

                    elements.recommend.style.setProperty("--index", activeIndex);

                    const currentItem = productItemsWithoutHidden[activeIndex];
                    const nextItem = productItemsWithoutHidden[activeIndex + 1];
                    if (currentItem) {
                        const currentTop = isForward ? currentItem.getBoundingClientRect().top + currentScrollY : currentItem.getBoundingClientRect().bottom + currentScrollY;
                        let progress = 1;

                        const nextTop = currentScrollY - window.innerHeight * 0.5;
                        const range = Math.max(currentTop - nextTop, 1);
                        progress = (viewportCenter - currentTop) / range;
                        progress = Math.min(Math.max(progress, 0), 1);

                        elements.recommend.style.setProperty("--previous", 1 - progress);
                        elements.recommend.style.setProperty("--next", progress);
                    }
                }
            }


        };

        if (elements.recommend) {
            elements.recommend.addEventListener("scroll", updateRecommendScrollState);
            window.addEventListener("scroll", updateRecommendScrollState);
            window.addEventListener("resize", updateRecommendScrollState);
            updateRecommendScrollState();
        }

        if (!elements.survey) return;

        // 이미 active 클래스가 존재하면 이벤트 등록하지 않음
        if (elements.survey.classList.contains("active")) return;

        const getSelectedValue = (input) => {
            if (!input) return "";
            if (input.value) return input.value;
            const label = document.querySelector(`label[for="${input.id}"]`);
            return label ? label.getAttribute("value") || "" : "";
        };

        const normalizeVisibility = (value) =>
            value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

        const updateSurveySelection = () => {
            const selected = document.querySelector('input[name="survey"]:checked');
            const selectedValue = getSelectedValue(selected);
            console.log("🚀 ~ updateSurveySelection ~ selectedValue:", selectedValue)

            if (elements.surveyButton) {
                elements.surveyButton.disabled = !selectedValue;
            }

            if (!selectedValue) {
                productItems.forEach((item) => {
                    item.hidden = false;
                });
                return;
            }

            productItems.forEach((item) => {
                const visibility = item.getAttribute("data-visibility") || "";
                const values = normalizeVisibility(visibility);
                item.hidden = !values.includes(selectedValue);
            });
        };

        if (surveyInputs.length) {
            surveyInputs.forEach((input) => {
                input.addEventListener("change", () => {
                    updateSurveySelection();
                });
            });
            updateSurveySelection();
        }

        elements.root.classList.add("scroll-lock");
        elements.body.classList.add("scroll-lock");

        let isActivated = false;

        const finalizeActivation = () => {
            if (isActivated) return;
            isActivated = true;
            addActive(elements.survey);

            // #overview 활성화 해제
            delay(1000, () => removeActive(elements.overview));

            // 이벤트 리스너 제거 (한 번만 실행되도록)
            document.removeEventListener("wheel", handleWheelTouch, { capture: true });
            document.removeEventListener("touchmove", handleWheelTouch, { capture: true });
            document.removeEventListener("click", handleClickTouchStart);
            document.removeEventListener("touchstart", handleClickTouchStart);
        };

        const handleWheelTouch = (e) => {
            // active 클래스가 없을 때는 스크롤 막고, 즉시 활성화
            if (!isActivated) {
                e.preventDefault();
                e.stopPropagation();
                finalizeActivation();
            }
        };

        const handleClickTouchStart = () => {
            finalizeActivation();
        };

        // 마우스 휠/터치무브: 스크롤 차단 + 활성화 (capture로 먼저 잡음)
        document.addEventListener("wheel", handleWheelTouch, { passive: false, capture: true });
        document.addEventListener("touchmove", handleWheelTouch, { passive: false, capture: true });

        // 클릭/터치 시작도 활성화
        document.addEventListener("click", handleClickTouchStart);
        document.addEventListener("touchstart", handleClickTouchStart);

        if (elements.surveyButton) {
            elements.surveyButton.addEventListener("click", () => {

                removeActive(elements.survey);
                window.scrollTo({ top: 0 });
                delay(1000, () => {
                    addActive(elements.recommend)
                    delay(400, () => {
                        elements.root.classList.remove("scroll-lock");
                        elements.body.classList.remove("scroll-lock");
                    })
                });
            });
        }

        // "나만의 시그니처 루틴 다시 만들기" 버튼 클릭 시 #survey 활성화
        const retryButton = document.querySelector("#retry-routine-button");
        if (retryButton) {
            retryButton.addEventListener("click", () => {
                addActive(elements.survey);
                elements.root.classList.add("scroll-lock");
                elements.body.classList.add("scroll-lock");
                delay(1000, () => {
                    surveyInputs.forEach((input) => {
                        input.checked = false;
                    });
                    updateSurveySelection();
                });
                delay(1400, () => {
                    removeActive(elements.recommend)
                });
            });
        }
    };

    document.addEventListener("DOMContentLoaded", (event) => {
        initRoutine();
    });
})(window);
