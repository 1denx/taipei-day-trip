document.addEventListener("DOMContentLoaded", async () => {
  await initPage();
});

let nextPage = 0;
let isLoading = false;
let currentKeyword = null;
let currentCategory = null;
let infiniteObserver = null;

async function initPage() {
  try {
    const [categories, mrts] = await Promise.all([
      fetchCategory(),
      fetchMrts(),
    ]);
    // console.log("categories", categories);
    // console.log("mrts:", mrts);

    renderCategorySelector(categories);
    initCategorySelector();
    initSearch();

    renderListBar(mrts);
    initMrtClick();

    const attractions = await fetchAttractions();
    // console.log(attractions);
    if (attractions) {
      renderGallery(attractions);
    }

    initInfiniteScroll();
  } catch (err) {
    console.error("初始化失敗", err);
  }
}

async function fetchCategory() {
  try {
    const res = await fetch("/api/categories");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error("載入分類失敗", err);
    return [];
  }
}

function createCategoryItem(category) {
  const li = document.createElement("li");
  const btn = document.createElement("button");

  btn.type = "button";
  btn.classList.add("selector__option");
  btn.textContent = category;
  btn.dataset.value = category === "全部分類" ? "" : category;

  li.appendChild(btn);
  return li;
}

function renderCategorySelector(categories) {
  const options = document.querySelector(".selector__options");
  options.innerHTML = "";

  const fragment = document.createDocumentFragment();
  fragment.appendChild(createCategoryItem("全部分類"));

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

  trigger.addEventListener("click", (e) => {
    e.stopPropagation; // 阻止冒泡，避免觸發 document 的關閉事件
    selector.classList.toggle("is-open");
  });

  optionsWrapper.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    optionText.textContent = btn.textContent;
    currentCategory = btn.dataset.value || null;

    selector.classList.remove("is-open");
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

  async function doSearch() {
    const keyword = searchInput.value.trim();
    currentKeyword = keyword || null;

    await resetAndFetchAttractions();
  }

  searchBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await doSearch();
  });

  searchInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await doSearch();
    }
  });
}

async function fetchMrts() {
  try {
    const res = await fetch("/api/mrts");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error("載入捷運站失敗", err);
    return [];
  }
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
    console.warn("找不到 .list-bar");
    return;
  }

  listBar.innerHTML = "";

  const fragment = document.createDocumentFragment();
  mrts.forEach((mrt) => {
    const li = createMrtItem(mrt);
    fragment.appendChild(li);
  });
  listBar.appendChild(fragment);

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

  listBar.addEventListener("click", async (e) => {
    const btn = e.target.closest(".text-list");
    if (!btn) return;

    const mrt = btn.textContent.trim();
    selectorText.textContent = "全部分類";
    currentCategory = null;
    currentKeyword = mrt;
    searchInput.value = mrt;

    await resetAndFetchAttractions();
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
      throw new Error(`HTTP ${res.status}`);
    }

    const result = await res.json();

    // 確認有抓到資料
    if (!result) {
      throw new Error("API 未回傳資料");
    }

    if (result.error === true) {
      nextPage = null;
      return [];
    }

    if (!result.hasOwnProperty("data") || !Array.isArray(result.data)) {
      console.error("API 回傳格式:", result);
      throw new Error("資料格式錯誤");
    }

    nextPage = result.nextPage;
    return result.data;
  } catch (err) {
    console.error("fetchAttractions error:", err);
    return null;
  } finally {
    isLoading = false;
  }
}

function createAttractionCard(attraction) {
  const cardLink = document.createElement("a");
  cardLink.href = `/attraction/${attraction.id}`;

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
  cardLink.appendChild(card);
  return cardLink;
}

function renderGallery(attractions) {
  const gallery = document.querySelector("#attractions-list");

  const fragment = document.createDocumentFragment();
  attractions.forEach((attraction) => {
    const card = createAttractionCard(attraction);
    fragment.appendChild(card);
  });
  gallery.appendChild(fragment);
}

async function resetAndFetchAttractions() {
  nextPage = 0;
  isLoading = false;

  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  try {
    const data = await fetchAttractions();

    if (data === null) {
      return;
    }

    if (data.length === 0) {
      showNoResults();
    } else {
      renderGallery(data);
    }
  } catch (err) {
    console.error("重新載入景點失敗", err);
  }

  initInfiniteScroll();
}

// Infinite Scroll
function initInfiniteScroll() {
  const sentinel = document.getElementById("scroll-sentinel");

  if (!sentinel) {
    console.warn("找不到 scroll-sentinel 元素");
    return;
  }

  // 清除舊的 observer，避免重複監聽
  if (infiniteObserver) {
    infiniteObserver.disconnect();
  }

  infiniteObserver = new IntersectionObserver(
    async (entries) => {
      const entry = entries[0];

      if (!entry.isIntersecting) return;
      if (isLoading) return;
      if (nextPage === null) return;

      try {
        const data = await fetchAttractions();
        if (data && data.length > 0) {
          renderGallery(data);
        }
      } catch (err) {
        console.error("載入下一頁失敗", err);
      }
    },
    {
      // 提前觸發：當 sentinel 距離可視範圍還有 100px 時就開始載入
      rootMargin: "100px",
    }
  );
  infiniteObserver.observe(sentinel);
}

function showNoResults() {
  const gallery = document.querySelector(".gallery");
  const message = document.createElement("div");
  message.classList.add("no-results");
  message.textContent = "找不到符合條件的景點";
  gallery.appendChild(message);
}
