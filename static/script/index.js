document.addEventListener("DOMContentLoaded", async () => {
  await initPage();
});

let nextPage = 0;
let isLoading = false;
let currentKeyword = null;
let currentCategory = null;

async function initPage() {
  try {
    const categories = await fetchCategory();
    // console.log("categories", categories);
    renderCategorySelector(categories);
    initCategorySelector();
    initSearch();

    const mrts = await fetchMrts();
    // console.log("mrts:", mrts);
    renderListBar(mrts);
    initMrtClick();

    const attractions = await fetchAttractions();
    // console.log(attractions);
    renderGallery(attractions);
  } catch (err) {
    console.error("初始化失敗", err);
  }
}

async function fetchCategory() {
  const res = await fetch("/api/categories");
  const data = await res.json();
  return data.data;
}

function createCategoryItem(category) {
  const li = document.createElement("li");
  const btn = document.createElement("button");

  btn.type = "button";
  btn.classList.add("selector__option");
  btn.textContent = category;
  btn.dataset.value = category;

  li.appendChild(btn);
  return li;
}

function renderCategorySelector(categories) {
  const options = document.querySelector(".selector__options");
  options.innerHTML = "";

  const fragment = document.createDocumentFragment();

  categories.forEach((category) => {
    const option = createCategoryItem(category);
    fragment.appendChild(option);
  });

  options.appendChild(fragment);
}

function initCategorySelector() {
  const selector = document.querySelector(".selector");
  const trigger = selector.querySelector(".selector__trigger");
  const optionText = trigger.querySelector(".selector__text");
  const optionsWrapper = selector.querySelector(".selector__options");

  trigger.addEventListener("click", () => {
    selector.classList.toggle("is-open");
  });

  optionsWrapper.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const searchInput = document.querySelector("#search-input");

    if (!btn) return;

    optionText.textContent = btn.textContent;
    currentCategory = btn.dataset.value || btn.textContent;

    currentKeyword = null;
    searchInput.value = "";

    selector.classList.remove("is-open");
    resetAndFetchAttractions();
  });

  document.addEventListener("click", (e) => {
    if (!selector.contains(e.target)) {
      selector.classList.remove("is-open");
    }
  });
}

function initSearch() {
  const searchInput = document.querySelector("#search-input");
  const searchBtn = document.querySelector("#search-btn");
  const selectorText = document.querySelector(".selector__text");

  function doSearch() {
    const keyword = searchInput.value.trim();

    currentKeyword = keyword || null;

    const categoryText = selectorText.textContent.trim();
    currentCategory = categoryText === "全部分類" ? null : categoryText;

    resetAndFetchAttractions();
  }

  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      doSearch();
    }
  });
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

function initMrtClick() {
  const listBar = document.querySelector(".list-bar");
  const selectorText = document.querySelector(".selector__text");
  const searchInput = document.querySelector("#search-input");

  listBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".text-list");
    if (!btn) return;

    const mrt = btn.textContent.trim();
    selectorText.textContent = "全部分類";
    currentCategory = null;
    currentKeyword = mrt;
    searchInput.value = mrt;

    resetAndFetchAttractions();
  });
}

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

function resetAndFetchAttractions() {
  nextPage = 0;
  isLoading = false;

  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  fetchAttractions().then((data) => {
    if (data) {
      renderGallery(data);
    }
  });
}
