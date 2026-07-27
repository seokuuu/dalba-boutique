/*
 * base.js - d'Alba PROFESSIONAL 공통 GSAP 유틸/모듈
 * signature base.js 복제본. 네임스페이스만 window.signature → window.professional 로 변경.
 * (HTML 클래스명 .fade-in-text / .horizontal-scroll 등은 signature와 동일하게 재사용)
 */
(function (window) {
    window.professional = window.professional || {};
    if (window.professional.utils || window.professional.modules) return;

    // ============================================================
    // Utils - 공통 유틸리티 함수
    // ============================================================
    const utils = {
        storage: {
            get(key) {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    return null;
                }
            },
            set(key, value) {
                localStorage.setItem(key, JSON.stringify(value));
            },
            remove(key) {
                localStorage.removeItem(key);
            },
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle(func, limit) {
            let inThrottle;
            return function () {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => (inThrottle = false), limit);
                }
            };
        },

        sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        },

        addClassname(selector, className) {
            const element = document.querySelector(`${selector}`);
            if (element) element.classList.add(className);
        },

        removeClassname(selector, className) {
            const element = document.querySelector(`${selector}`);
            if (element) element.classList.remove(className);
        },

        disposeInstance(instance) {
            if (instance && typeof instance.kill === "function") instance.kill();
            return null;
        },

        setAttribute(el, name, value) {
            if (!el) return;
            if (value === null || value === undefined) el.removeAttribute(name);
            else el.setAttribute(name, value);
        },

        setAttributes(el, attrs) {
            if (!el || !attrs) return;
            for (const [key, val] of Object.entries(attrs)) {
                if (val === null || val === undefined) el.removeAttribute(key);
                else el.setAttribute(key, val);
            }
        },

        addEventListenerOnce(el, type, handler) {
            const fn = (e) => {
                el.removeEventListener(type, fn);
                handler(e);
            };
            el.addEventListener(type, fn);
        },

        playVideoSafely(video) {
            try {
                const p = video.play();
                if (p && typeof p.then === "function") {
                    p.catch(() => {
                        video.muted = true;
                        video.play().catch(() => {});
                    });
                }
            } catch (_) {}
        },

        getCurrentBreakpoint() {
            const mediaQueries = {
                lg: window.matchMedia("(min-width: 1201px)"),
                md: window.matchMedia("(min-width: 961px)"),
                sm: window.matchMedia("(min-width: 601px)"),
            };

            if (mediaQueries.lg.matches) return "lg";
            if (mediaQueries.md.matches) return "md";
            if (mediaQueries.sm.matches) return "sm";
            return "xs";
        },

        onBreakpointChange({ onXs, onSm, onMd, onLg }) {
            let currentMatchMediaQuery = null;

            const handleResize = () => {
                const matchMediaQuery = this.getCurrentBreakpoint();

                if (matchMediaQuery === currentMatchMediaQuery) return;

                currentMatchMediaQuery = matchMediaQuery;

                switch (matchMediaQuery) {
                    case "lg":
                        onLg && onLg();
                        break;
                    case "md":
                        onMd && onMd();
                        break;
                    case "sm":
                        onSm && onSm();
                        break;
                    case "xs":
                        onXs && onXs();
                        break;
                }
            };

            handleResize();

            window.addEventListener("resize", this.debounce(handleResize, 400));
        },
    };
    // ============================================================
    // Modules - 공통 함수
    // ============================================================
    const modules = {
        /**
         * 비디오 poster를 반응형으로 설정
         * data-poster-mobile, data-poster-desktop 속성을 기반으로 전환
         */
        setupResponsiveVideoPosters() {
            const videos = Array.from(document.querySelectorAll("video.video-player__video"));
            if (!videos.length) return;

            const mq = window.matchMedia("(max-width: 600px)");

            const applyPoster = (e) => {
                const isMobile = e.matches;
                videos.forEach((video) => {
                    const posterMobile = video.getAttribute("data-poster-mobile");
                    const posterDesktop = video.getAttribute("data-poster-desktop");
                    if (!posterMobile && !posterDesktop) return;
                    const target = isMobile ? posterMobile : posterDesktop;
                    if (target) video.poster = target;
                });
            };

            // 최초 1회
            applyPoster(mq);
            // 변경 감지
            if (typeof mq.addEventListener === "function") {
                mq.addEventListener("change", applyPoster);
            } else if (typeof mq.addListener === "function") {
                // Safari 구버전 호환
                mq.addListener(applyPoster);
            }
        },

        /**
         * 텍스트 하이라이트 애니메이션
         * @param {Object} options
         * @param {HTMLElement[]} options.wordElements - 텍스트 요소 배열
         * @param {string} options.defaultColor - 기본 색상
         * @param {string} options.highlightColor - 하이라이트 색상
         * @param {number} options.startIndex - 하이라이트 시작 인덱스
         * @param {function} options.callback - 하이라이트 시 호출될 콜백 함수
         */
        useTextHighlight({ wordElements, defaultColor, highlightColor, startIndex = 0, callback }) {
            if (!wordElements.length) return;

            let lastIndex = startIndex;
            let highlightCompleted = false;

            const setRangeColor = (from, to, color) => {
                for (let i = from; i <= to; i++) {
                    if (wordElements[i]) wordElements[i].style.color = color;
                }
            };

            setRangeColor(0, wordElements.length - 1, defaultColor);
            if (lastIndex > 0) setRangeColor(0, lastIndex, highlightColor);

            const progressHighlight = (self) => {
                const total = wordElements.length;
                if (!total) return;

                const targetIndex = Math.floor(self.progress * (total - 1) + 0.00001);
                if (targetIndex === lastIndex || targetIndex < startIndex) return;
                if (targetIndex > lastIndex) {
                    setRangeColor(lastIndex, targetIndex, highlightColor);
                } else {
                    setRangeColor(targetIndex, lastIndex, defaultColor);
                }
                lastIndex = targetIndex;

                callback && callback(wordElements[targetIndex], targetIndex);
            };
            return {
                progressHighlight,
            };
        },

        /**
         * 페이드 인 텍스트 하이라이트 애니메이션 초기화
         * @param {Object} options
         * @param {HTMLElement[]} options.fadeInTextElements - 페이드 인 텍스트 요소 배열
         * @param {string} options.defaultColor - 기본 색상
         * @param {string} options.highlightColor - 하이라이트 색상
         * @param {number} options.startIndex - 하이라이트 시작 인덱스
         * @param {Object} options.enabledBreakpoints - breakpoint별 애니메이션 활성화 여부
         * @param {boolean} options.enabledBreakpoints.xs - xs breakpoint 애니메이션 활성화 (기본값: true)
         * @param {boolean} options.enabledBreakpoints.sm - sm breakpoint 애니메이션 활성화 (기본값: true)
         * @param {boolean} options.enabledBreakpoints.md - md breakpoint 애니메이션 활성화 (기본값: true)
         * @param {boolean} options.enabledBreakpoints.lg - lg breakpoint 애니메이션 활성화 (기본값: true)
         * @param {function} options.callbackFactory - 요소별 캐싱된 콜백을 반환하는 factory 함수 (fadeInElement, wordElements) => callback
         */
        initFadeInTextProgressHighlight({
            fadeInTextElements,
            defaultColor = "#5A432F",
            highlightColor = "#ffffff",
            startIndex,
            enabledBreakpoints = {},
            callbackFactory,
        }) {
            if (!fadeInTextElements.length) return;

            // breakpoint별 활성화 여부 (기본값: 모두 true)
            const breakpointConfig = {
                xs: enabledBreakpoints.xs !== false,
                sm: enabledBreakpoints.sm !== false,
                md: enabledBreakpoints.md !== false,
                lg: enabledBreakpoints.lg !== false,
            };

            let triggers = [];

            const teardown = () => {
                if (triggers && triggers.length) {
                    triggers.forEach((st) => st && st.kill && st.kill());
                    triggers = [];
                }
            };

            const initialize = () => {
                teardown();
                fadeInTextElements.forEach((fadeInElement) => {
                    const words = gsap.utils.toArray(".fade-in-text__word", fadeInElement);
                    if (!words.length) return;
                    for (let i = 0; i < words.length; i++) {
                        words[i].style.color = highlightColor;
                    }

                    const st = ScrollTrigger.create({
                        trigger: fadeInElement,
                        start: "top top",
                        end: "+=30%",
                        scrub: 0.3,
                        pin: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    });
                    triggers.push(st);
                });
            };

            const animation = () => {
                teardown();
                fadeInTextElements.forEach((fadeInElement) => {
                    const wordElements = gsap.utils.toArray(".fade-in-text__word", fadeInElement);
                    if (!wordElements.length) return;

                    const callback = callbackFactory ? callbackFactory(fadeInElement, wordElements) : null;

                    const { progressHighlight } = this.useTextHighlight({
                        wordElements,
                        defaultColor,
                        highlightColor,
                        startIndex,
                        callback,
                    });

                    const st = ScrollTrigger.create({
                        trigger: fadeInElement,
                        start: "top top",
                        end: "+=200%",
                        scrub: 0.5,
                        pin: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => progressHighlight(self),
                    });
                    triggers.push(st);
                });
            };

            utils.onBreakpointChange({
                onXs: breakpointConfig.xs ? animation : initialize,
                onSm: breakpointConfig.sm ? animation : initialize,
                onMd: breakpointConfig.md ? animation : initialize,
                onLg: breakpointConfig.lg ? animation : initialize,
            });
        },

        /**
         * 가로 스크롤 섹션 애니메이션 초기화
         * @param {Object} options
         * @param {HTMLElement[]} options.itemElements - 스크롤 아이템 요소 배열
         * @param {HTMLElement[]} options.contentElements - 콘텐츠 요소 배열
         * @returns {gsap.core.Timeline|null} 생성된 타임라인 또는 null
         */
        initHorizontalSectionsReveal({ itemElements, contentElements }) {
            const triggerElement = document.querySelector(".horizontal-scroll");
            if (!triggerElement || !itemElements.length) return null;

            itemElements.forEach((el, index) => {
                gsap.set(el, {
                    zIndex: (itemElements.length - index) * 5,
                    clipPath: "inset(0 0% 0 0)",
                });
            });

            const total = itemElements.length;

            // 타임라인 생성 (ScrollTrigger 없이)
            const timeline = gsap.timeline({ paused: true });

            for (let i = 0; i < total - 1; i++) {
                const itemElement = itemElements[i];
                const contentElement = contentElements[i];

                timeline.to(
                    itemElement,
                    {
                        clipPath: "inset(0 100% 0 0)",
                        ease: "power2.inOut",
                        duration: 1,
                    },
                    i
                );

                if (contentElement) {
                    timeline.to(
                        contentElement,
                        {
                            x: "-150%",
                            ease: "power2.inOut",
                            duration: 1,
                        },
                        i
                    );
                }
            }

            // 현재 활성화된 아이템 인덱스를 계산하고 active 클래스 토글
            const updateActiveItem = (progress) => {
                const activeIndex = Math.round(progress * (total - 1));
                itemElements.forEach((el, index) => {
                    if (index === activeIndex) {
                        el.classList.add("active");
                    } else {
                        el.classList.remove("active");
                    }
                });
            };

            // 초기 상태에서 첫 번째 아이템에 active 클래스 추가
            updateActiveItem(0);

            // ScrollTrigger로 타임라인 제어
            ScrollTrigger.create({
                trigger: triggerElement,
                start: "top top",
                end: () => `+=${(total - 1) * 100}%`,
                scrub: 1,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    timeline.progress(self.progress);
                    updateActiveItem(self.progress);
                },
            });

            return timeline;
        },
    };

    // GSAP 플러그인 즉시 등록 (DOMContentLoaded 전에 등록해야 함)
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable);

    // EaselPlugin은 선택적 - 존재할 때만 등록
    if (typeof EaselPlugin !== "undefined") {
        gsap.registerPlugin(EaselPlugin);
    }

    // 네임스페이스에 등록
    window.professional.utils = utils;
    window.professional.modules = modules;

    document.addEventListener("DOMContentLoaded", () => {
        ScrollTrigger.config({
            ignoreMobileResize: true,
            autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
        });

        window.addEventListener(
            "resize",
            utils.debounce(() => {
                ScrollTrigger.refresh();
            }, 400)
        );

        document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);

        modules.setupResponsiveVideoPosters();
    });
})(window);