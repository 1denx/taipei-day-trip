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
