import { requireAuth, getCurrentUser } from "../components/requireAuth.js";
import { initTapPay, getPrime } from "../services/tappay.js";
import {
  isValidName,
  isValidEmail,
  isValidPhone,
  isValidForm,
  clearInputMessage,
} from "../components/utils.js";

let currentBookingData = null;

(async function initBookingPage() {
  const isAuthenticated = await requireAuth("redirect");
  if (!isAuthenticated) return;

  const user = getCurrentUser();
  console.log("GET USER", user);
  const userName = document.querySelector("#booking-user-name");
  userName.textContent = user?.name || "";

  await initBooking();
  try {
    initTapPay();
  } catch (err) {
    console.error("TapPay 初始化失敗", err);
    alert("付款系統初始化失敗，請重新整理頁面");
  }

  const delBtn = document.querySelector(".del__btn");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      const confirmed = confirm("確定要刪除此行程嗎？");
      if (!confirmed) return;
      await deleteBooking();
    });
  }

  const confirmBtn = document.querySelector("#confirm-btn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", handleConfirmBooking);
  }

  // 即時驗證
  setupRealtimeValid();
})();

async function initBooking() {
  const bookingData = await getBookingData();
  console.log("預訂資料", bookingData);

  if (!bookingData) return;
  currentBookingData = bookingData;
  renderBooking(bookingData);
}

async function getBookingData() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/booking", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("取得預定資料失敗");
    }

    const result = await res.json();
    if (!result.data) {
      renderEmptyBooking();
      return null;
    }
    return result.data;
  } catch (err) {
    console.error("系統錯誤，請稍後再試", err);
    return null;
  }
}
function renderEmptyBooking() {
  const emptyBooking = document.querySelector("#empty-booking");
  const hasBooking = document.querySelector("#has-booking");
  const footer = document.querySelector(".footer");

  emptyBooking.hidden = false;
  hasBooking.hidden = true;
  footer.classList.add("footer--expanded");
}

function renderBooking(data) {
  if (!data) return;

  const { attraction, date, time, price } = data;
  const user = getCurrentUser();

  const imgEl = document.querySelector("#booking__image");
  const titleEl = document.querySelector("#booking-title");
  const dateEl = document.querySelector("#booking-date");
  const timeEl = document.querySelector("#booking-time");
  const priceEl = document.querySelector("#booking-price");
  const addressEl = document.querySelector("#booking-address");

  const bookingNameEl = document.querySelector("#booking-name");
  const bookingEmailEl = document.querySelector("#booking-email");

  const confirmTextEl = document.querySelector(".confirm__text");

  imgEl.src = attraction.image;
  imgEl.alt = attraction.name || "";
  titleEl.textContent = `台北一日遊：${attraction.name}`;
  dateEl.textContent = date;
  timeEl.textContent =
    time === "morning" ? "早上 9 點到 12 點" : "下午 2 點到晚上 9 點";
  priceEl.textContent = price;
  addressEl.textContent = attraction.address;

  bookingNameEl.value = user.name;
  bookingEmailEl.value = user.email;

  confirmTextEl.textContent = `總價：新台幣 ${price} 元`;
}

async function deleteBooking() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/booking", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("刪除預訂資料失敗");
    }

    const result = await res.json();
    if (result) {
      renderEmptyBooking();
    }
  } catch (err) {
    console.error("系統錯誤，請稍後再試", err);
  }
}

// 設定即時驗證
function setupRealtimeValid() {
  const nameInput = document.querySelector("#booking-name");
  const emailInput = document.querySelector("#booking-email");
  const phoneInput = document.querySelector("#booking-phone");

  // 失去焦點時驗證
  if (nameInput) {
    nameInput.addEventListener("blur", () => {
      if (nameInput.value.trim()) {
        isValidName(nameInput);
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      if (emailInput.value.trim()) {
        isValidEmail(emailInput);
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("blur", () => {
      if (phoneInput.value.trim()) {
        isValidPhone(phoneInput);
      }
    });
  }
}

// 處理確認訂購
async function handleConfirmBooking() {
  const confirmBtn = document.querySelector("#confirm-btn");
  const nameInput = document.querySelector("#booking-name");
  const emailInput = document.querySelector("#booking-email");
  const phoneInput = document.querySelector("#booking-phone");

  // 清除之前的錯誤訊息
  [nameInput, emailInput, phoneInput].forEach((input) => {
    if (input) {
      clearInputMessage(input);
    }
  });

  // 驗證聯絡資訊
  const isContactValid = isValidForm([
    { input: nameInput, validator: isValidName },
    { input: emailInput, validator: isValidEmail },
    { input: phoneInput, validator: isValidPhone },
  ]);

  if (!isContactValid) return;

  if (!currentBookingData) {
    alert("沒有可預訂的行程");
    return;
  }

  // 防止重複提交
  confirmBtn.disabled = true;

  try {
    const prime = await getPrime();
    console.log("取得 Prime:", prime);

    const orderData = {
      prime: prime,
      order: {
        price: currentBookingData.price,
        trip: {
          attraction: {
            id: currentBookingData.attraction.id,
            name: currentBookingData.attraction.name,
            address: currentBookingData.attraction.address,
            image: currentBookingData.attraction.image,
          },
          date: currentBookingData.date,
          time: currentBookingData.time,
        },
        contact: {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          phone: phoneInput.value.trim(),
        },
      },
    };

    // 送出訂單
    const result = await submitOrder(orderData);

    if (result.ok) {
      const orderNumber = result.data.number;
      window.location.href = `/thankyou?number=${orderNumber}`;
    } else {
      throw new Error(result.message || "訂單處理失敗");
    }
  } catch (err) {
    console.error("訂購錯誤", err);

    let errMessage = "訂購失敗，請稍後再試";

    if (err.message.includes("信用卡")) {
      errMessage = "請確認信用卡資訊";
    } else if (err.message.includes("Prime")) {
      errMessage = "信用卡資訊處理失敗";
    } else if (err.message.includes("付款")) {
      errMessage = "付款失敗，請確認信用卡資訊";
    }

    alert(errMessage);
  } finally {
    confirmBtn.disabled = false;
  }
}

async function submitOrder(orderData) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "訂單送出失敗");
    }

    return {
      ok: true,
      data: result.data,
    };
  } catch (err) {
    console.error("送出訂單錯誤", err);
    return {
      ok: false,
      message: err.message,
    };
  }
}
