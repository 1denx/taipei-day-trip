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
      const userItem = document.querySelector("#user-item");
      const userBtn = document.querySelector("#user-btn");
      const dropdown = document.querySelector("#user-dropdown");
      const logoutBtn = document.querySelector("#logout-btn");

      if (hasToken) {
        authItem.classList.add("btn--nav--hidden");
        userItem.classList.remove("btn--nav--hidden");

        // 先從 localStorage 取快取頭像，避免閃爍
        const cachedAvatar = localStorage.getItem("userAvatar");
        const headerAvatar = document.querySelector("#user-avatar");
        if (cachedAvatar && headerAvatar) {
          headerAvatar.src = cachedAvatar;
        }

        // 取得使用者資料並更新頭像
        try {
          const userRes = await fetch("/api/user/auth", {
            headers: { Authorization: `Bearer ${hasToken}` },
          });
          const userData = await userRes.json();
          const avatar = userData?.data?.avatar;

          if (headerAvatar) {
            if (avatar) {
              headerAvatar.src = avatar;
              localStorage.setItem("userAvatar", avatar);
            } else {
              headerAvatar.src = "/static/images/circle_user.svg";
              localStorage.removeItem("userAvatar");
            }
          }
        } catch (err) {
          console.error("取得使用者頭像失敗：", err);
        }
      } else {
        authItem.classList.remove("btn--nav--hidden");
        userItem.classList.add("btn--nav--hidden");
      }

      // 點擊頭像切換下拉選單
      userBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
      });

      // 點擊其他地方關閉選單
      document.addEventListener("click", () => {
        dropdown.classList.add("hidden");
      });

      // 登出
      logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userAvatar");
        window.location.href = "/";
      });

      const bookingBtn = document.querySelector("#booking-btn");

      if (bookingBtn) {
        bookingBtn.addEventListener("click", async () => {
          const isAuthenticated = await requireAuth("dialog");
          if (isAuthenticated) {
            window.location.href = "/booking";
          }
        });
      }

      // 觸發自定義事件，通知 header 已載入完成
      const headerEvent = new CustomEvent("headerLoaded");
      document.dispatchEvent(headerEvent); // 讀取時直接觸發
    }
  } catch (err) {
    console.error("載入 header 失敗：", err);
  }
})();
