import { requireAuth } from "./requireAuth.js";

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

      const bookingBtn = document.querySelector("#booking-btn");

      let redirToBooking = false;

      if (bookingBtn) {
        bookingBtn.addEventListener("click", async () => {
          const ok = await requireAuth();
          if (ok) {
            window.location.href = "/booking";
          } else {
            redirToBooking = true;
          }
        });
      }

      document.addEventListener("loginSuccess", () => {
        if (redirToBooking) {
          redirToBooking = false;
          window.location.href = "/booking";
        }
      });

      // 觸發自定義事件，通知 header 已載入完成
      const headerEvent = new CustomEvent("headerLoaded");
      document.dispatchEvent(headerEvent); // 讀取時直接觸發
    }
  } catch (err) {
    console.error("載入 header 失敗：", err);
  }
})();
