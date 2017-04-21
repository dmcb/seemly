window.addEventListener('load', function () {
    function scrollCycle() {
        var scrollTopToBottom = $(document).height()-$(window).height();
        var pixelsToGetToBottom = scrollTopToBottom-$(document).scrollTop();
        var timeRemaining = pixelsToGetToBottom*50;

        $('body')
            .animate({ scrollTop: scrollTopToBottom }, timeRemaining, 'linear')
            .animate({ scrollTop: 0 }, scrollTopToBottom*50, 'linear', scrollCycle);
    }

    function stopScroll(calledBy) {
        $('body').stop(true);

        setTimeout(function(){
            if (!$('body').queue().length) {
                scrollCycle();
                registerMouseMoveKillingScroll();
                registerWindowResizeKillingScroll();
            }
        }, 30000);
    }

    function registerMouseMoveKillingScroll() {
        $('body').one('mousemove', function() {
            stopScroll('mousemove');
        });
    }

    function registerWindowResizeKillingScroll() {
        $(window).one('resize', function() {
            stopScroll('resize');
        });
    }

    setTimeout(function(){
        scrollCycle();
        registerMouseMoveKillingScroll();
        registerWindowResizeKillingScroll();
    }, 30000);

    setTimeout(function() {
        location.reload(true);
    }, 86400000);
});

$(document).ready(function() {
    $('span.date').each(function() {
        var date = $(this).html();
        $(this).html(moment(date, 'x').format('YYYY/MM/DD'));
    });
});
