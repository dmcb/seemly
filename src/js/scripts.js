window.addEventListener('load', function () {
    function scrollCycle() {
        $("html, body")
            .animate({ scrollTop: $(document).height()-$(window).height() }, $(document).height()*50, 'linear')
            .animate({ scrollTop: 0 }, $(document).height()*50, 'linear', function() { scrollCycle(); });
    }

    setTimeout(function(){
        scrollCycle();
    }, 30000);
});

$(document).ready(function() {
    $('span.date').each(function() {
        var date = $(this).html();
        $(this).html(moment(date, 'x').format('YYYY/MM/DD'));
    });
});
