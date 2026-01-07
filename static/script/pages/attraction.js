document.addEventListener("DOMContentLoaded", async () => {
  await initAttractionPage();
});

async function initAttractionPage() {
  try {
    const attractionData = await fetchAttractionData();
    // console.log("FETCH", attractionData);

    if (!attractionData) {
      return;
    }

    renderCarousel(attractionData.images);
    renderAttractionInfo(attractionData);

    initBookingPanel();
  } catch (err) {
    console.error("初始化失敗", err);
  }
}

async function fetchAttractionData() {
  try {
    const attractionId = window.location.pathname.split("/").pop();
    const url = `/api/attraction/${attractionId}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`景點 ID ${attractionId} 不存在`);
      return null;
    }

    const data = await res.json();

    if (!data || !data.data) {
      return null;
    }

    return data.data;
  } catch (err) {
    console.error("載入景點資料失敗", err);
    return null;
  }
}

function createCarouselItem(imageSrc, alt = "") {
  const li = document.createElement("li");
  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = alt;

  img.onerror = () => {
    console.error(`圖片載入失敗, ${imageSrc}`);
    img.scr =
      "https://dummyimage.com/540x406/e8e8e8/757575&text=Image+Load+Failed";
  };

  li.appendChild(img);
  return li;
}

function createNavItem(index) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("carousel-indicators__item");
  btn.dataset.index = index;

  return btn;
}

function renderCarousel(images) {
  const track = document.querySelector(".carousel__track");
  const navContainer = document.querySelector(".carousel-indicators");

  if (!track || !navContainer) {
    console.warn("找不到 carousel 元素");
    return;
  }

  if (!images || images.length === 0) {
    console.warn("沒有圖片資料");
    track.innerHTML = `<li><img src="https://dummyimage.com/540x406/e8e8e8/757575&text=No+images+available."></li>`;
    return;
  }

  track.innerHTML = "";
  navContainer.innerHTML = "";

  const trackFragment = document.createDocumentFragment();
  images.forEach((imageUrl, index) => {
    const li = createCarouselItem(imageUrl, `景點圖片 ${index + 1}`);
    trackFragment.appendChild(li);
  });
  track.appendChild(trackFragment);

  const navFragment = document.createDocumentFragment();
  images.forEach((_, index) => {
    const navItem = createNavItem(index);
    navFragment.appendChild(navItem);
  });
  navContainer.appendChild(navFragment);

  requestAnimationFrame(() => {
    initCarousel();
  });
}

function initCarousel() {
  const viewport = document.querySelector(".carousel__viewport");
  const track = document.querySelector(".carousel__track");
  const items = track.querySelectorAll("li");
  const btnLeft = document.querySelector(".carousel-control--left");
  const btnRight = document.querySelector(".carousel-control--right");
  const navContainer = document.querySelector(".carousel-indicators");
  const navWrapper = document.querySelector(".carousel-indicators__wrapper");
  const navItems = document.querySelectorAll(".carousel-indicators__item");

  if (!items.length) return;

  let currentIndex = 0;
  const totalItems = items.length;

  function syncNavWidth() {
    if (navWrapper && viewport) {
      const viewportWidth = viewport.offsetWidth;
      navWrapper.style.maxWidth = `${viewportWidth}px`;
    }
  }

  function updateCarousel() {
    const viewportWidth = viewport.clientWidth;
    const translateX = -currentIndex * viewportWidth;
    track.style.transform = `translateX(${translateX}px)`;

    navItems.forEach((nav, index) => {
      if (index === currentIndex) {
        nav.classList.add("--active");
      } else {
        nav.classList.remove("--active");
      }
    });

    syncNavWidth();
  }

  btnRight.onclick = () => {
    currentIndex++;
    if (currentIndex >= totalItems) {
      currentIndex = 0;
    }
    updateCarousel();
  };

  btnLeft.onclick = () => {
    currentIndex--;
    if (currentIndex < 0) {
      currentIndex = totalItems - 1;
    }
    updateCarousel();
  };

  navItems.forEach((nav) => {
    nav.onclick = () => {
      currentIndex = parseInt(nav.dataset.index);
      updateCarousel();
    };
  });
  updateCarousel();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateCarousel();
    }, 100);
  });
}

function renderAttractionInfo(data) {
  const infoTitle = document.querySelector(".info-panel__title");
  const catAndMrt = document.querySelector(".info-panel__text");
  const descEl = document.querySelector(".content__description-text");
  const addressEl = document.querySelector(".content__address-text");
  const transportEl = document.querySelector(".content__transport-text");

  if (infoTitle) {
    infoTitle.textContent = data.name;
  }

  if (catAndMrt) {
    catAndMrt.textContent = `${data.category} at ${data.mrt}`;
  }

  if (descEl) {
    descEl.textContent = data.description;
  }

  if (addressEl) {
    addressEl.textContent = data.address;
  }

  if (transportEl) {
    transportEl.textContent = data.transport;
  }
}

function initBookingPanel() {
  const timeRadios = document.querySelectorAll('input[name="time"]');
  const bookingPrice = document.querySelector(".booking-price");

  timeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      bookingPrice.textContent =
        radio.value === "morning" ? "新台幣 2000 元" : "新台幣 2500 元";
    });
  });
}
