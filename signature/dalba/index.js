(function (window) {
    const signature = window.signature || null;
    if (!signature) {
        console.error("[signature/index.js] signature not found!");
        return;
    }

    const { utils, modules } = signature;

    const initHeroContainerAnimation = () => {
        const heroContainer = document.querySelector(".hero__container");
        if (!heroContainer) return;

        // DOM 요소 캐싱 (매번 querySelector 호출 방지)
        const headerTrigger = document.querySelector(".header__trigger");
        const headerElement = document.querySelector(".header");

        // 캐싱된 값들
        let cachedBreakpoint = utils.getCurrentBreakpoint();
        let cachedTargetTopPx = 0;
        let cachedHeaderHeight = headerElement ? headerElement.offsetHeight : 0;

        // breakpoint 변경 시에만 값 갱신
        const updateCachedValues = () => {
            cachedBreakpoint = utils.getCurrentBreakpoint();
            cachedHeaderHeight = headerElement ? headerElement.offsetHeight : 0;
            
            if (cachedBreakpoint === "xs" || cachedBreakpoint === "sm") {
                if (headerTrigger) {
                    const rect = headerTrigger.getBoundingClientRect();
                    cachedTargetTopPx = rect.bottom + 12;
                } else {
                    cachedTargetTopPx = 0;
                }
            } else {
                cachedTargetTopPx = cachedHeaderHeight / 2;
            }
        };

        // resize 시 캐시 갱신
        window.addEventListener("resize", utils.debounce(updateCachedValues, 200));
        updateCachedValues();

        const getInitialTop = () => {
            return cachedBreakpoint === "xs" || cachedBreakpoint === "sm" ? 85 : 76.5;
        };
        const initialWidth = 95;

        const computeInitialTopPx = () => (getInitialTop() / 100) * window.innerHeight;

        gsap.set(heroContainer, {
            top: `${computeInitialTopPx()}px`,
            width: `${initialWidth}%`,
            opacity: 0,
            xPercent: -50,
            x: 0,
            y: 30,
        });

        gsap.to(heroContainer, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "linear",
        });

        let wasAtTarget = false;
        let lastProgress = -1;

        ScrollTrigger.create({
            trigger: ".hero",
            start: "top top",
            end: "+=100%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const progress = self.progress;
                
                // progress가 거의 변하지 않으면 스킵 (성능 최적화)
                if (Math.abs(progress - lastProgress) < 0.001) return;
                lastProgress = progress;

                const initialTop = getInitialTop();

                const currentWidth = initialWidth - (initialWidth - (135 / window.innerWidth) * 100) * progress;
                heroContainer.style.width = `${Math.max(135, (currentWidth * window.innerWidth) / 100)}px`;

                const initialTopPx = (initialTop / 100) * window.innerHeight;
                const currentTopPx = initialTopPx + (cachedTargetTopPx - initialTopPx) * progress;

                if (currentTopPx <= cachedTargetTopPx) {
                    heroContainer.style.top = `${cachedTargetTopPx}px`;
                    if (!wasAtTarget) {
                        wasAtTarget = true;
                        heroContainer.classList.add("is-fade-out");
                        heroContainer.classList.remove("is-fade-in");
                    }
                } else {
                    heroContainer.style.top = `${currentTopPx}px`;
                    if (wasAtTarget) {
                        heroContainer.classList.remove("is-fade-out");
                        heroContainer.classList.add("is-fade-in");
                        wasAtTarget = false;
                    }
                }
            },
            onRefresh: () => {
                updateCachedValues();
                const initialTop = getInitialTop();
                if (cachedBreakpoint === "md" || cachedBreakpoint === "lg") {
                    const currentWidth = initialWidth - (initialWidth - (135 / window.innerWidth) * 100) * 0;
                    heroContainer.style.width = `${Math.max(135, (currentWidth * window.innerWidth) / 100)}px`;
                } else {
                    heroContainer.style.width = `${initialWidth}%`;
                }
                gsap.set(heroContainer, { xPercent: -50, x: 0 });
                heroContainer.style.top = `${computeInitialTopPx()}px`;
                heroContainer.classList.remove("is-fade-out");
                heroContainer.classList.remove("is-fade-in");
                lastProgress = -1;
            },
        });
    };

    const initSlideUpTextReveal = () => {
        gsap.set([".slide-up-text__main-title", ".slide-up-text__paragraph"], {
            y: 30,
            opacity: 0,
        });

        const timeline = gsap.timeline({ paused: true });

        timeline.to(".slide-up-text__main-title", {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
        });

        timeline.to(
            ".slide-up-text__paragraph",
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power2.out",
            },
            "-=0.7"
        );

        // 텍스트 애니메이션 트리거
        ScrollTrigger.create({
            trigger: ".slide-up-text",
            start: "top 30%",
            onEnter: () => {
                timeline.play();
            },
            onLeaveBack: () => {
                timeline.reverse();
            },
        });

        // slide-up-text 비디오는 섹션 진입 시 재생 (기존 동작 복원)
        const videoElement = document.querySelector(".slide-up-text__video");
        if (videoElement) {
            // 해당 비디오의 플레이어 인스턴스 찾기
            const getVideoPlayer = () => {
                if (window.videoPlayers) {
                    return window.videoPlayers.find((player) => player.videoElement === videoElement);
                }
                return null;
            };

            ScrollTrigger.create({
                trigger: ".slide-up-text",
                start: "top top",
                end: "+=30%",
                pin: true,
                // pinSpacing: false,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onEnter: () => {
                    // 비디오 플레이어 인스턴스를 통해 재생 (상태 관리 포함)
                    const player = getVideoPlayer();
                    if (player && player.play) {
                        player.play();
                    } else {
                        // 플레이어 인스턴스가 없으면 직접 재생
                        utils.playVideoSafely(videoElement);
                    }
                },
            });
        }
    };

    const initCarouselScrollAndControls = () => {
        const carouselElement = document.querySelector(".carousel");
        const draggableElement = document.querySelector(".carousel__draggable");
        const listElement = document.querySelector(".carousel__list");
        const lastItemElement = document.querySelector(".carousel__item:last-child");
        const prevButtonElement = document.querySelector(".carousel__control--prev");
        const nextButtonElement = document.querySelector(".carousel__control--next");

        if (!carouselElement || !listElement || !lastItemElement) return;

        const itemElements = gsap.utils.toArray(".carousel__item");

        const computeItemCenterOffsetX = (index) => {
            const itemElement = itemElements[index];
            if (!itemElement) return 0;

            const itemOffsetLeft = itemElement.offsetLeft;
            const itemWidth = itemElement.offsetWidth;

            if (index === 0) {
                return 0;
            }

            if (index === itemElements.length - 1) {
                return -(itemOffsetLeft - window.innerWidth + itemWidth);
            }

            return -(itemOffsetLeft - window.innerWidth / 2 + itemWidth / 2);
        };

        // const scrollCarouselToIndex = (index) => {
        //     if (index < 0 || index >= itemElements.length) return;

        //     currentIndex = index;
        //     const targetX = computeItemCenterOffsetX(index);

        //     gsap.to(listElement, {
        //         x: targetX,
        //         duration: 0.8,
        //         ease: "power2.out",
        //     });
        // };

        const computeCarouselEndOffsetX = () => {
            const lastItemOffsetLeft = lastItemElement.offsetLeft;
            const lastItemWidth = lastItemElement.offsetWidth;
            return -(lastItemOffsetLeft - window.innerWidth / 2 + lastItemWidth / 2);
        };

        const animateButtonVisibility = (button, shouldShow, duration = 0.3) => {
            if (!button) return;

            const opacity = shouldShow ? 1 : 0;
            const pointerEvents = shouldShow ? "auto" : "none";

            gsap.to(button, {
                opacity,
                duration,
                ease: "power2.out",
                onStart: () => {
                    if (shouldShow) button.style.pointerEvents = pointerEvents;
                },
                onComplete: () => {
                    if (!shouldShow) button.style.pointerEvents = pointerEvents;
                },
            });
        };

        const updateCarouselButtonStates = (index) => {
            const isFirst = index === 0;
            const isLast = index === itemElements.length - 1;

            animateButtonVisibility(prevButtonElement, !isFirst);
            animateButtonVisibility(nextButtonElement, !isLast);
        };

        const initializeCarouselButtonStates = () => {
            updateCarouselButtonStates(currentIndex);
        };

        let tween;
        let combinedST;
        let pinST;
        let itemSTs = [];
        let currentIndex = 0;

        const initializeCarouselScrollTriggers = () => {
            const matchMediaQuery = utils.getCurrentBreakpoint();

            tween = utils.disposeInstance(tween);
            combinedST = utils.disposeInstance(combinedST);
            pinST = utils.disposeInstance(pinST);
            if (itemSTs && itemSTs.length) {
                itemSTs.forEach((st) => st.kill());
                itemSTs = [];
            }

            pinST = ScrollTrigger.create({
                trigger: carouselElement,
                start: "top top",
                end: () => `+=${Math.abs(computeCarouselEndOffsetX())}`,
                pin: matchMediaQuery === "xs" ? false : true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                fastScrollEnd: true,
                onEnter: () => {
                    utils.addClassname(".discover", "is-sticky");
                    utils.addClassname(".breadcrumb", "is-sticky");
                    utils.addClassname(".footer", "is-sticky");
                },
                onEnterBack: () => {
                    utils.addClassname(".discover", "is-sticky");
                    utils.addClassname(".breadcrumb", "is-sticky");
                    utils.addClassname(".footer", "is-sticky");
                },
            });

            itemElements.forEach((itemElement) => {
                const st = ScrollTrigger.create({
                    trigger: itemElement,
                    start: "left right",
                    end: "right left",
                    containerAnimation: tween,
                    onEnter: () => {
                        const videoElement = itemElement.querySelector("video");
                        if (!videoElement) return;
                        utils.playVideoSafely(videoElement);
                    },
                    onEnterBack: () => {
                        const videoElement = itemElement.querySelector("video");
                        if (!videoElement) return;
                        utils.playVideoSafely(videoElement);
                    },
                });
                itemSTs.push(st);
            });
        };

        const computeCarouselMaxDragDistance = () => {
            // 리스트의 전체 너비에서 뷰포트 너비를 뺀 값이 최대 드래그 거리
            const listTotalWidth = listElement.scrollWidth;
            const viewportWidth = window.innerWidth;
            return Math.max(0, listTotalWidth - viewportWidth);
        };

        const enableCarouselDragForXS = () => {
            tween = utils.disposeInstance(tween);
            combinedST = utils.disposeInstance(combinedST);

            gsap.set(carouselElement, { clearProps: "all" });
            gsap.set(listElement, { clearProps: "all" });

            const maxDragDistance = computeCarouselMaxDragDistance();

            const draggableInstance = Draggable.create(listElement, {
                type: "x",
                allowContextMenu: true,
                dragClickables: true,
                cursor: "grab",
                activeCursor: "grabbing",
                bounds: { minX: -maxDragDistance, maxX: 0 },
                inertia: true,
                onDrag: function () {
                    const currentX = this.x;
                    let closestIndex = 0;
                    let minDistance = Math.abs(currentX - computeItemCenterOffsetX(0));

                    for (let i = 1; i < itemElements.length; i++) {
                        const distance = Math.abs(currentX - computeItemCenterOffsetX(i));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = i;
                        }
                    }

                    if (closestIndex !== currentIndex) {
                        currentIndex = closestIndex;
                        updateCarouselButtonStates(currentIndex);
                    }
                },
                onThrowUpdate: function () {
                    const currentX = this.x;
                    let closestIndex = 0;
                    let minDistance = Math.abs(currentX - computeItemCenterOffsetX(0));

                    for (let i = 1; i < itemElements.length; i++) {
                        const distance = Math.abs(currentX - computeItemCenterOffsetX(i));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = i;
                        }
                    }

                    if (closestIndex !== currentIndex) {
                        currentIndex = closestIndex;
                        updateCarouselButtonStates(currentIndex);
                    }
                },
            })[0];

            initializeCarouselButtonStates();

            if (prevButtonElement) {
                prevButtonElement.addEventListener("click", () => {
                    const prevIndex = currentIndex - 1;
                    if (prevIndex >= 0) {
                        const targetX = computeItemCenterOffsetX(prevIndex);
                        gsap.to(listElement, {
                            x: targetX,
                            duration: 0.8,
                            ease: "power2.out",
                            onUpdate: () => {
                                draggableInstance.update();
                            },
                            onComplete: () => {
                                currentIndex = prevIndex;
                                updateCarouselButtonStates(prevIndex);
                            },
                        });
                    }
                });
            }

            if (nextButtonElement) {
                nextButtonElement.addEventListener("click", () => {
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < itemElements.length) {
                        const targetX = computeItemCenterOffsetX(nextIndex);
                        gsap.to(listElement, {
                            x: targetX,
                            duration: 0.8,
                            ease: "power2.out",
                            onUpdate: () => {
                                draggableInstance.update();
                            },
                            onComplete: () => {
                                currentIndex = nextIndex;
                                updateCarouselButtonStates(nextIndex);
                            },
                        });
                    }
                });
            }
        };

        const enableCarouselScrollAnimationForSMAndUp = () => {
            Draggable.get(draggableElement)?.kill();

            const toX = computeCarouselEndOffsetX();

            tween = gsap.fromTo(listElement, { x: 0 }, { x: toX, ease: "linear", duration: 0.05, paused: true });

            combinedST = ScrollTrigger.create({
                trigger: carouselElement,
                start: "top bottom",
                end: () => `+=${window.innerHeight + Math.abs(computeCarouselEndOffsetX())}`,
                scrub: 1,
                invalidateOnRefresh: true,
                fastScrollEnd: true,
                onUpdate: (self) => {
                    tween.progress(self.progress);
                },
            });
        };

        initializeCarouselScrollTriggers();

        window.addEventListener(
            "resize",
            utils.debounce(() => {
                initializeCarouselScrollTriggers();
            }, 400)
        );

        utils.onBreakpointChange({
            onXs: enableCarouselDragForXS,
            onSm: enableCarouselScrollAnimationForSMAndUp,
            onMd: enableCarouselScrollAnimationForSMAndUp,
            onLg: enableCarouselScrollAnimationForSMAndUp,
        });
    };

    // discover 섹션 스냅 (별도 ScrollTrigger가 없으므로 추가)
    const initDiscoverSnap = () => {
        const discoverSection = document.querySelector(".discover");
        if (!discoverSection) return;

        ScrollTrigger.create({
            trigger: discoverSection,
            start: "top top",
            end: "bottom bottom",
        });
    };

    document.addEventListener("DOMContentLoaded", (event) => {
        // 터치패드/마우스 휠의 관성 스크롤과 snap 애니메이션 충돌 방지
        // GSAP가 스크롤 이벤트를 직접 제어하여 snap 중 스크롤 잠김 현상 해결
        ScrollTrigger.normalizeScroll(true);

        // ScrollTrigger 초기화 순서: 페이지 위에서 아래 순서로 초기화해야 pin 위치가 올바르게 계산됨
        initHeroContainerAnimation();
        modules.initFadeInTextProgressHighlight({
            fadeInTextElements: gsap.utils.toArray(".fade-in-text"),
            enabledBreakpoints: {
                xs: false,
                sm: false,
                md: true,
                lg: true,
            },
        });
        modules.initHorizontalSectionsReveal({
            itemElements: gsap.utils.toArray(".horizontal-scroll__item"),
            contentElements: gsap.utils.toArray(".horizontal-scroll__content"),
        });
        initSlideUpTextReveal();
        initCarouselScrollAndControls();
        initDiscoverSnap();

        // 모든 ScrollTrigger 생성 후 refresh하여 위치 재계산
        ScrollTrigger.refresh();
    });
})(window);