(async function loadHeader() {
  try {
    const res = await fetch("/static/header.html");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const html = await res.text();
    const header = document.querySelector("#header-container");

    if (header) {
      header.innerHTML = html;

      const hasToken = localStorage.getItem("token");
      const authItem = document.querySelector("#auth-item");
      const logoutItem = document.querySelector("#logout-item");

      if (hasToken) {
        authItem.classList.add("btn--nav--hidden");
        logoutItem.classList.remove("btn--nav--hidden");
      } else {
        authItem.classList.remove("btn--nav--hidden");
        logoutItem.classList.add("btn--nav--hidden");
      }

      // 觸發自定義事件，通知 header 已載入完成
      const event = new CustomEvent("headerLoaded");
      document.dispatchEvent(event); // 讀取時直接觸發
    }
  } catch (err) {
    console.error("載入 header 失敗：", err);
  }
})();
