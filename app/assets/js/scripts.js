window.addEventListener('load', function () {
    function scrollCycle() {
        $("html, body")
            .animate({ scrollTop: $(document).height()-$(window).height() }, $(document).height()*50, 'linear')
            .animate({ scrollTop: 0 }, $(document).height()*50, 'linear', function() { scrollCycle(); });
    }

    scrollCycle();
});