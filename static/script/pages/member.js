import { requireAuth, getCurrentUser } from "../components/requireAuth.js";
// import { getAuthHeader } from "./auth.js";
import {
  showInputMessage,
  setInputSuccess,
  clearFormInputErrors,
} from "../components/utils.js";
import { getAuthHeader } from "../components/auth.js";

(async function initMemberPage() {
  const isAuthenticated = await requireAuth("redirect");
  if (!isAuthenticated) return;

  const contentTitle = document.querySelector(".content__title");
  const memberBtn = document.querySelector(".member-btn");
  const historyBtn = document.querySelector(".history-btn");
  const editBtn = document.querySelector("#edit-btn");

  if (memberBtn) {
    memberBtn.addEventListener("click", async () => {
      switchTab("member");
    });
  }

  if (historyBtn) {
    historyBtn.addEventListener("click", async () => {
      switchTab("history");
      await loadOrderHistory();
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", handleEditToggle);
  }

  function switchTab(tab) {
    const infoContent = document.querySelector(".info-content");
    const historyContent = document.querySelector(".history-content");

    if (tab === "member") {
      contentTitle.textContent = "會員資料";

      memberBtn.classList.add("active");
      historyBtn.classList.remove("active");

      infoContent.hidden = false;
      historyContent.hidden = true;
    } else {
      contentTitle.textContent = "歷史訂單";

      memberBtn.classList.remove("active");
      historyBtn.classList.add("active");

      infoContent.hidden = true;
      historyContent.hidden = false;
    }
  }

  await initMember();
})();

async function initMember() {
  const user = getCurrentUser();
  console.log("GET USER", user);

  await renderMember(user);
}

async function renderMember(user) {
  const currentUserName = document.querySelector(".user-data__name");
  const userEmail = document.querySelector("#user-email");
  const userName = document.querySelector("#user-name");

  currentUserName.textContent = user.name;
  userEmail.value = user.email;
  userName.value = user.name;
}

let isEditing = false;
async function handleEditToggle() {
  const editForm = document.querySelector(".edit-form");
  const editBtn = document.querySelector("#edit-btn");
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

  if (!isEditing) {
    isEditing = true;
    editBtn.textContent = "儲存";
    currentPwd.removeAttribute("readonly");
    newPwd.removeAttribute("readonly");
    confirmPwd.removeAttribute("readonly");

    currentPwd.value = "";
    newPwd.value = "";
    confirmPwd.value = "";
    clearFormInputErrors(editForm);
  } else {
    await saveChanges();
  }
}

function validatePwdFields() {
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");
  const editForm = document.querySelector(".edit-form");

  clearFormInputErrors(editForm);

  let isValid = true;

  // 檢查當前密碼
  if (!currentPwd.value.trim()) {
    showInputMessage(currentPwd, "請輸入當前密碼");
    isValid = false;
  } else {
    setInputSuccess(currentPwd);
  }

  // 檢查新密碼
  if (!newPwd.value.trim()) {
    showInputMessage(newPwd, "請輸入新密碼");
    isValid = false;
  } else if (newPwd.value.length < 6) {
    showInputMessage(newPwd, "新密碼長度至少需要 6 個字元");
    isValid = false;
  } else if (currentPwd.value === newPwd.value) {
    showInputMessage(newPwd, "新密碼不得與當前密碼相同");
    isValid = false;
  } else {
    setInputSuccess(newPwd);
  }

  // 檢查確認密碼
  if (!confirmPwd.value.trim()) {
    showInputMessage(confirmPwd, "請輸入確認密碼");
    isValid = false;
  } else if (confirmPwd.value !== newPwd.value) {
    showInputMessage(confirmPwd, "新密碼與確認密碼不一致");
    isValid = false;
  } else {
    setInputSuccess(confirmPwd);
  }

  return isValid;
}

async function saveChanges() {
  const editForm = document.querySelector(".edit-form");
  const editBtn = document.querySelector("#edit-btn");
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

  const isChangingPwd = currentPwd.value || newPwd.value || confirmPwd.value;

  if (isChangingPwd) {
    if (!validatePwdFields()) {
      return;
    }

    const success = await changePwd(currentPwd.value, newPwd.value);
    if (!success) {
      return;
    }

    setInputSuccess(currentPwd);
    setInputSuccess(newPwd);
    setInputSuccess(confirmPwd);

    alert("變更密碼成功");

    // 重置編輯模式
    setTimeout(() => {
      isEditing = false;
      editBtn.textContent = "編輯";
      currentPwd.setAttribute("readonly", true);
      newPwd.setAttribute("readonly", true);
      confirmPwd.setAttribute("readonly", true);

      currentPwd.value = "";
      newPwd.value = "";
      confirmPwd.value = "";
      clearFormInputErrors(editForm);
    }, 1500);
  }
}

async function changePwd(currentPassword, newPassword) {
  const currentPwd = document.querySelector("#current-pwd");

  try {
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        currentPwd: currentPassword,
        newPwd: newPassword,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        showInputMessage(currentPwd, "當前密碼輸入錯誤");
      } else if (result.message) {
        showInputMessage(currentPwd, result.message);
      } else {
        showInputMessage(currentPwd, "密碼變更失敗，請稍後再試");
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error("變更密碼錯誤：", err);
    showInputMessage(currentPwd, "系統錯誤，請稍後再試");
    return false;
  }
}

async function loadOrderHistory() {
  try {
    const res = await fetch("/api/orders/history", {
      headers: getAuthHeader(),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("無法載入歷史訂單");
      return;
    }

    renderOrderHistory(result.data || []);
  } catch (err) {
    console.error("載入歷史訂單錯誤：", err);
  }
}

function renderOrderHistory(orders) {
  const tbody = document.querySelector(".order-table tbody");

  // 清空現有內容
  tbody.innerHTML = "";

  if (!orders || orders.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");

    td.setAttribute("colspan", "7");
    td.style.textAlign = "center";
    td.style.padding = "2rem";
    td.textContent = "目前沒有訂單紀錄";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  orders.forEach((order) => {
    const tr = document.createElement("tr");

    const tdOrderNumber = document.createElement("td");
    tdOrderNumber.textContent = order.order_number || order.orderNumber || "-";
    tr.appendChild(tdOrderNumber);

    const tdAttractionName = document.createElement("td");
    tdAttractionName.textContent =
      order.attraction_name || order.attractionName || "-";
    tr.appendChild(tdAttractionName);

    const tdDate = document.createElement("td");
    tdDate.textContent = order.booking_date || order.date || "-";
    tr.appendChild(tdDate);

    const tdTime = document.createElement("td");
    tdTime.textContent = formatTime(order.booking_time || order.time);
    tr.appendChild(tdTime);

    const tdPrice = document.createElement("td");
    tdPrice.textContent = order.price || "-";
    tr.appendChild(tdPrice);

    const tdStatus = document.createElement("td");
    tdStatus.textContent = formatPaymentStatus(order.status);
    tr.appendChild(tdStatus);

    const tdPaidAt = document.createElement("td");
    tdPaidAt.textContent = formatDate(order.paid_at || order.paidAt);
    tr.appendChild(tdPaidAt);

    tbody.appendChild(tr);
  });
}

// 格式化時間
function formatTime(time) {
  if (time === "morning") return "早上9點-下午4點";
  if (time === "afternoon") return "下午2點-晚上9點";
  return time || "-";
}

// 格式化付款狀態
function formatPaymentStatus(status) {
  if (status === 0 || status === "0") {
    return "待付款";
  }
  if (status === 1 || status === "1") {
    return "已付款";
  }

  // 處理字串型態的 status
  const statusMap = {
    paid: "已付款",
    pending: "待付款",
    cancelled: "已取消",
  };

  return statusMap[status] || "-";
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  return date.toLocaleString("zh-TW", {
    // 取得本地的日期與時間
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
