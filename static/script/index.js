const selector = document.querySelector(".selector");
const trigger = selector.querySelector(".selector__trigger");
const options = selector.querySelectorAll("li");

trigger.addEventListener("click", () => {
  selector.classList.toggle("is-open");
});

options.forEach((option) => {
  option.addEventListener("click", () => {
    trigger.querySelector("span").textContent = option.textContent;
    selector.classList.remove("is-open");
  });
});

document.addEventListener("click", (e) => {
  if (!selector.contains(e.target)) {
    selector.classList.remove("is-open");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await initPage();
});

async function initPage() {
  try {
    const mrts = await fetchMrts();
    // console.log("mrts:", mrts);
    renderListBar(mrts);

    const attractions = await fetchAttractions();
    // console.log(attractions);
    renderGallery(attractions);
  } catch (err) {
    console.error("初始化 LIST-BAR 失敗", err);
  }
}

async function fetchMrts() {
  const res = await fetch("/api/mrts");
  const data = await res.json();
  return data.data;
}

function createMrtItem(mrt) {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("text-list");
  btn.textContent = mrt;

  li.appendChild(btn);
  return li;
}

function renderListBar(mrts) {
  const listBar = document.querySelector(".list-bar");

  if (!listBar) {
    console.log("找不到 .list-bar");
    return;
  }

  listBar.innerHTML = "";

  mrts.forEach((mrt) => {
    const li = createMrtItem(mrt);
    listBar.appendChild(li);
  });

  requestAnimationFrame(() => {
    initSwiper();
  });
}

function initSwiper() {
  const viewport = document.querySelector(".list-bar__viewport");
  const listBar = document.querySelector(".list-bar");
  const items = listBar.querySelectorAll("li");
  const btnLeft = document.querySelector(".control-left");
  const btnRight = document.querySelector(".control-right");

  if (!items.length) return;

  let currentX = 0;

  function getLastItemRight() {
    const lastItem = items[items.length - 1];
    return lastItem.offsetLeft + lastItem.offsetWidth;
  }

  function update() {
    listBar.style.transform = `translateX(${currentX}px)`;

    btnLeft.disabled = currentX >= 0;

    const viewportRight = Math.abs(currentX) + viewport.clientWidth;
    btnRight.disabled = viewportRight >= getLastItemRight();
  }

  btnRight.onclick = () => {
    const viewportWidth = viewport.clientWidth;
    const maxTranslate = getLastItemRight() - viewportWidth;

    currentX -= viewportWidth;

    if (Math.abs(currentX) > maxTranslate) {
      currentX = -maxTranslate;
    }
    update();
  };

  btnLeft.onclick = () => {
    const viewportWidth = viewport.clientWidth;

    currentX += viewportWidth;

    if (currentX > 0) {
      currentX = 0;
    }
    update();
  };

  update();
}

let nextPage = 0;
let isLoading = false;
let currentKeyword = null;
let currentCategory = null;

async function fetchAttractions() {
  if (isLoading || nextPage === null) return;
  isLoading = true;

  try {
    const params = new URLSearchParams();
    params.append("page", nextPage);

    if (currentKeyword) {
      params.append("keyword", currentKeyword);
    }

    if (currentCategory) {
      params.append("category", currentCategory);
    }

    const res = await fetch(`/api/attractions?${params.toString()}`);

    if (!res.ok) {
      throw new Error("API 請求失敗");
    }

    const result = await res.json();

    // 確認有抓到資料
    if (!result || !Array.isArray(result.data)) {
      throw new Error("資料格式錯誤");
    }

    nextPage = result.nextPage;
    return result.data;
  } catch (err) {
    console.error("fetchAttractions error:", err);
  } finally {
    isLoading = false;
  }
}

function createAttractionCard(attraction) {
  const card = document.createElement("article");
  card.classList.add("card");

  const cover = document.createElement("div");
  cover.classList.add("card__cover");

  const img = document.createElement("img");
  img.classList.add("card__image");
  img.src = attraction.images?.[0] || "";
  img.alt = attraction.name || "";

  const title = document.createElement("h3");
  title.classList.add("card__title", "text-content-bold");
  title.textContent = attraction.name || "";

  cover.appendChild(img);
  cover.appendChild(title);

  const details = document.createElement("div");
  details.classList.add("card__details");

  const mrt = document.createElement("span");
  mrt.classList.add("card__mrt");
  mrt.textContent = attraction.mrt || "";

  const category = document.createElement("span");
  category.classList.add("card__category");
  category.textContent = attraction.category || "";

  details.appendChild(mrt);
  details.appendChild(category);
  card.appendChild(cover);
  card.appendChild(details);
  return card;
}

function renderGallery(attractions) {
  const gallery = document.querySelector(".gallery");

  gallery.innerHTML = "";

  const fragment = document.createDocumentFragment();

  attractions.forEach((attraction) => {
    const card = createAttractionCard(attraction);
    fragment.appendChild(card);
  });

  gallery.appendChild(fragment);
}
