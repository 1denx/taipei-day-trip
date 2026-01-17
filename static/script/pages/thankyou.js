import { requireAuth, getCurrentUser } from "../components/requireAuth.js";

(async function initThankyouPage() {
  const isAuthenticated = await requireAuth("redirect");
  if (!isAuthenticated) return;

  const user = getCurrentUser();
  console.log("GET USER", user);

  await initThankyou();

  const returnBtn = document.querySelector("#return-btn");
  if (returnBtn) {
    returnBtn.addEventListener("click", async () => {
      window.location.href = "/";
    });
  }

  const queryBtn = document.querySelector("#query-btn");
  if (queryBtn) {
    queryBtn.addEventListener("click", async () => {
      // window.location.href = "/member";
    });
  }
})();

async function initThankyou() {
  const orderData = await getOrderData();
  console.log("預定資料", orderData);

  if (!orderData) {
    alert("查無訂單資料");
    window.location.href = "/";
    return;
  }

  renderThankyou(orderData);
}

async function getOrderData() {
  try {
    // 從 url 取得訂單編號
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get("number");

    if (!orderNumber) {
      console.error("找不到訂單編號");
      return null;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/order/${orderNumber}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ERROR STATUS: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      console.error(data.message);
      return null;
    }
    console.log("訂單查詢結果:", data);

    if (!data.data) {
      console.log("訂單不存在");
      return null;
    }

    return data.data;
  } catch (err) {
    console.error("系統錯誤，請稍後再試", err);
    return null;
  }
}

function renderThankyou(orderData) {
  const orderNumberEl = document.querySelector(".order-number");

  if (orderNumberEl && orderData.number) {
    orderNumberEl.textContent = orderData.number;
  }
}
