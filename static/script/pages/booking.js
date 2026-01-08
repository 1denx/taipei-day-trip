import { requireAuth, getCurrentUser } from "../components/requireAuth.js";

(async function initBookingPage() {
  const isAuthenticated = await requireAuth();
  if (!isAuthenticated) return;

  const user = getCurrentUser();
  console.log("GET USER", user);
  const userName = document.querySelector("#booking-user-name");
  userName.textContent = user?.name || "";
  await initBooking();
})();

async function initBooking() {
  const bookingData = await getBookingData();
  console.log("預訂資料", bookingData);

  if (!bookingData) return;

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

const delBtn = document.querySelector(".del__btn");
delBtn.addEventListener("click", async () => {
  const confirmed = confirm("確定要刪除此行程嗎？");
  if (!confirmed) return;

  await deleteBooking();
});

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
