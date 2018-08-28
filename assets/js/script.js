//detecting scroll
window.onscroll = function() {scrollFunction()};
//function for go to top button
function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        $("#goTop").fadeIn();
    } else {
        $("#goTop").fadeOut();
    }
}