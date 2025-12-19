var swiper = new Swiper(".mySwiper", {
    effect: "fade", 
    loop: true,
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
});
  console.log("MENU SCRIPT LOADED");

  const menu = document.getElementById("menu");
  const box  = document.getElementById("box");

  window.addEventListener("scroll", function () {
    console.log("scrollY:", window.scrollY);

    if (window.scrollY >= 150) {
        box.classList.add("stuck");
      menu.classList.add("stuck");
    } else {
      menu.classList.remove("stuck");
      box.classList.remove("stuck");
    }
  });
