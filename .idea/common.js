$(document).ready(function(){
    function checkWindowSize() {
        if ( $(window).width() < 901) { 
            $('body').removeClass('pc');
            $('body').addClass('mobile');
        } else {  
            $('body').addClass('pc');
            $('body').removeClass('mobile');
        }
    }
    checkWindowSize();
    window.onresize = function (event) {
        checkWindowSize();
    };    
})

//gnb open
$(document).ready(function(){
    $('.btn_menu > a, .gnb_oepn_bg').click(function(){
        if($('#header_wrap > div').hasClass('header_menu_close')){
            $('.header').removeClass('header_menu_close').addClass('header_menu_open');
            $('.gnb_oepn_bg').show();
            if (matchMedia("screen and (min-width: 901px)").matches) {
                $('.sub-menu-collapse-item + .menu_open_icon').addClass('active');
            }
            $('.sub-menu-collapse-item').click(function(e){
                e.preventDefault();
            });
        }else if($('#header_wrap > div').hasClass('header_menu_open')){
            $('.header').removeClass('header_menu_open').addClass('header_menu_close');
            $('.gnb_oepn_bg').hide();
            $('.sub-menu-collapse-item').unbind();
        }
    });
});

//gnb 뎁스 open
$(document).ready(function(){
    if (matchMedia('screen and (max-width: 900px)').matches){
        $('.menu_open_icon').removeClass('active');
    } 
    $('.sub-menu-collapse-item').click(function(e){
        $(e.target).toggleClass('active');
        $(e.target).next().toggleClass('active');
    });
});

//search
$(document).ready(function(){
    $('.searchBtn').click(function(){
        var searchBarWrapInnerH = $('.searchBarWrapInner').outerHeight(true);
        $('.searchBarWrap').animate({
            height: searchBarWrapInnerH + 'px'
        });
        $('.searchbg').show();
    });
    $('.searchCloseBtn, .searchbg').click(function(){
        $('.searchBarWrap').animate({
            height: '0px'
        });
        $('.searchbg').hide();
    });
});

//전성분 tab
window.addEventListener('load', function(){
    $('.bottom_ingredient .ingredientTabContent').hide();
    $('.bottom_ingredient .ingredientTabContent:first').show();
    $('.bottom_ingredient .ingredientTabBtn').click(function () {
        $('.bottom_ingredient .ingredientTabBtn').removeClass('active');
        $(this).addClass('active');
        $('.bottom_ingredient .ingredientTabContent').hide()
        var activeTab = $(this).attr('rel');
        $('#' + activeTab).fadeIn()
    });
});

//스토리 비건 페이지 tab
window.addEventListener('load', function(){
    $('.story_vegan_wrap .ingredientTabContent').hide();
    $('.story_vegan_wrap .ingredientTabContent:first').show();
    $('.story_vegan_wrap .ingredientTabBtn').click(function () {
        $('.story_vegan_wrap .ingredientTabBtn').removeClass('active');
        $(this).addClass('active');
        $('.story_vegan_wrap .ingredientTabContent').hide()
        var activeTab = $(this).attr('rel');
        $('#' + activeTab).fadeIn()
    });
});


//accordion 
window.addEventListener('load', function(){
    $('.accordion_contents_wrap > .accordion_tit').each(function(){
        if( $(this).hasClass('on') ) {
            // $('.accordion_contents_wrap > .accordion_contents').hide();
            $(this).next().show();
        }
    })
    $('.accordion_contents_wrap > .accordion_tit').on('click', function(){
        if( $(this).hasClass('on') ) {
            $(this).removeClass('on');
            $(this).next().stop().slideUp();
            return false;
        } else {
            $('.accordion_contents_wrap > .accordion_contents').stop().slideUp();
            $('.accordion_contents_wrap > .accordion_tit').removeClass('on');
            $(this).addClass('on');
            $(this).next().stop().slideDown();
            return false;
        }
    });

    $('.accordion_contents_wrap_type2 > .accordion_tit').each(function(){
        if( $(this).hasClass('on') ) {
            $('.accordion_contents_wrap_type2 > .accordion_contents').hide();
            $(this).next().show();
        }
    })
    $('.accordion_contents_wrap_type2 > .accordion_tit').on('click', function(){
        if( $(this).hasClass('on') ) {
            $(this).removeClass('on');
            $(this).next().stop().slideUp();
            return false;
        } else {
            $('.accordion_contents_wrap_type2 > .accordion_contents').stop().slideUp();
            $('.accordion_contents_wrap_type2 > .accordion_tit').removeClass('on');
            $(this).addClass('on');
            $(this).next().stop().slideDown();
            return false;
        }
    });
});



$(document).ready(function(){
    // background color change
    function initDynamicBackgroundSection() {
        var $wrapper = $(".module-info-img");
        var sectionList = $("[data-dynamic-bg-color]");
        var preActiveSection = null;

        sectionList.addClass("dynamic-bg");
        $wrapper.addClass("dynamic-bg");

        window.addEventListener("scroll", function(e) {

            var activeColor = null;
            var isChanged = false;

            for (var i = 0; i < sectionList.length; i++) {
                var section = sectionList[i];
                var boundary = section.getBoundingClientRect();
                var isVisible = boundary.width !== 0 && boundary.height !== 0;
                var isActive = boundary.top <= 0 && (boundary.height + boundary.top) >= 0;

                if (isVisible && isActive) {

                    if (preActiveSection !== section) {
                        preActiveSection = section;
                        isChanged = true;
                        activeColor = $(section).data("dynamic-bg-color");
                    }
                }
            }

            if (isChanged) {
                sectionList.css("background-color", activeColor);
                $wrapper.css("background-color", activeColor);
            }

        });
    }

    initDynamicBackgroundSection();
});


//클릭시 제품 active
window.addEventListener('load', function(){
    $('.collection_wrap .floatright > p > a').on('click', function(){
        $('.collection_wrap .floatright > p > a').css('opacity','0.5');
        $('.collection_wrap .floatright > p > a img').not('.hover_layer img').fadeOut();
        $('.collection_wrap .floatright > p > a .hover_layer').fadeOut();
        $(this).css('opacity','1');
        $(this).children().fadeIn();
    });
});


// function initDynamicBackgroundSection() {
//     var $wrapper = $(".hince-v2-collection");
//     var sectionList = $("[data-dynamic-bg-color]");
//     var preActiveSection = null;

//     sectionList.addClass("dynamic-bg");
//     $wrapper.addClass("dynamic-bg");

//     window.addEventListener("scroll", function(e) {

//         var activeColor = null;
//         var isChanged = false;

//         for (var i = 0; i < sectionList.length; i++) {
//             var section = sectionList[i];
//             var boundary = section.getBoundingClientRect();
//             var isVisible = boundary.width !== 0 && boundary.height !== 0;
//             var isActive = boundary.top <= 0 && (boundary.height + boundary.top) >= 0;

//             if (isVisible && isActive) {

//                 if (preActiveSection !== section) {
//                     preActiveSection = section;
//                     isChanged = true;
//                     activeColor = $(section).data("dynamic-bg-color");
//                 }
//             }
//         }

//         if (isChanged) {
//             sectionList.css("background-color", activeColor);
//             $wrapper.css("background-color", activeColor);
//         }

//     });
// }

// initDynamicBackgroundSection();

// 울쎄라 아코디언 임시 코드
$(document).ready(function() {
    if (window.location.search.includes('1000000538')) {
        $('.accordion_contents_wrap.bottom_colorshade').hide();
        $('.accordion_contents_wrap.bottom_ingredient').hide();
    }
});