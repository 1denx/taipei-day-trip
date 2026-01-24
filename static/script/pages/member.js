import { requireAuth, getCurrentUser } from "../components/requireAuth.js";
import {
  showInputMessage,
  setInputSuccess,
  clearFormInputErrors,
  isValidName,
} from "../components/utils.js";
import { getAuthHeader } from "../components/auth.js";

// 儲存當前使用者資料
let currentUserData = null;

(async function initMemberPage() {
  const isAuthenticated = await requireAuth("redirect");
  if (!isAuthenticated) return;

  const contentTitle = document.querySelector(".content__title");
  const memberBtn = document.querySelector(".member-btn");
  const historyBtn = document.querySelector(".history-btn");
  const avatarWrapper = document.querySelector("#avatar-wrapper");
  const editBtn = document.querySelector("#edit-btn");
  const cancelBtn = document.querySelector("#cancel-btn");

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

  if (cancelBtn) {
    cancelBtn.classList.add("is-hidden");
    cancelBtn.addEventListener("click", handleCancel);
  }

  if (avatarWrapper) {
    avatarWrapper.addEventListener("click", handleAvatarClick);
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
  currentUserData = user;
  await renderMember(user);
}

async function renderMember(user) {
  const currentUserName = document.querySelector(".user-data__name");
  const userEmail = document.querySelector("#user-email");
  const userName = document.querySelector("#user-name");
  const avatarImg = document.querySelector(".user-data__avatar");

  currentUserName.textContent = user.name;
  userEmail.value = user.email;
  userName.value = user.name;

  // 設定頭像(自訂頭像，或者使用預設)
  if (user.avatar) {
    avatarImg.src = user.avatar;
  } else {
    avatarImg.src = "/static/images/circle_user.svg";
  }
}

function handleAvatarClick() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
  fileInput.style.display = "none";

  // 監聽檔案選擇
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadAvatar(file);
    }
  });

  // 觸發檔案選擇
  fileInput.click();
}

async function uploadAvatar(file) {
  const avatarImg = document.querySelector(".user-data__avatar");
  const avatarWrapper = document.querySelector("#avatar-wrapper");
  const overlay = document.querySelector(".user-data__avatar-overlay");

  try {
    if (file.size > 5 * 1024 * 1024) {
      alert("檔案大小超過 5MB");
      return;
    }

    // 檢查檔案類型
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("只允許上傳圖片檔案 (jpg, jpeg, png, gif, webp)");
      return;
    }

    // 建立 FormData
    const formData = new FormData();
    formData.append("file", file);

    // 顯示載入中狀態
    avatarWrapper.classList.add("uploading");
    if (overlay) {
      overlay.innerHTML = `
      <span class="material-symbols-outlined">hourglass_empty</span>
      <span>上傳中...</span>
      `;
    }

    const res = await fetch("/api/user/avatar", {
      method: "POST",
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    const result = await res.json();

    // 移除載入狀態
    avatarWrapper.classList.remove("uploading");
    if (overlay) {
      overlay.innerHTML = `
      <span class="material-symbols-outlined">photo_camera</span>
      <span>點擊上傳</span>
      `;
    }

    if (!res.ok) {
      avatarImg.style.opacity = "1";
      if (result.error && result.message) {
        alert(result.message);
      } else {
        alert("頭像上傳失敗，請稍後再試");
      }
      return;
    }

    // 更新頭像顯示
    avatarImg.src = result.data.avatar;

    // 更新全域使用者資料
    currentUserData = result.data;
    alert("頭像上傳成功");
  } catch (err) {
    console.error("上傳頭像錯誤：", err);
    avatarWrapper.classList.remove("uploading");
    if (overlay) {
      overlay.innerHTML = `
      <span class="material-symbols-outlined">photo_camera</span>
      <span>點擊上傳</span>
      `;
    }
    alert("系統錯誤，請稍後再試");
  }
}

let isEditing = false;
async function handleEditToggle() {
  const editForm = document.querySelector(".edit-form");
  const editBtn = document.querySelector("#edit-btn");
  const cancelBtn = document.querySelector("#cancel-btn");
  const userName = document.querySelector("#user-name");
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

  if (!isEditing) {
    isEditing = true;
    editBtn.textContent = "儲存";
    cancelBtn.classList.remove("is-hidden");

    userName.removeAttribute("readonly");
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

function handleCancel() {
  const userName = document.querySelector("#user-name");
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

  // 確認是否有未儲存的變更
  const hasChanges =
    userName.value.trim() !== currentUserData.name ||
    currentPwd.value ||
    newPwd.value ||
    confirmPwd.value;

  if (hasChanges) {
    const confirmCancel = confirm("有未儲存的變更，確定要取消嗎");
    if (!confirmCancel) {
      return;
    }
  }

  userName.value = currentUserData.name;

  resetEditMode();
}

function validatePwdFields() {
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

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
  const userName = document.querySelector("#user-name");
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

  if (!currentUserData) {
    return;
  }

  const isChangingName = userName.value.trim() !== currentUserData.name;
  const isChangingPwd = currentPwd.value || newPwd.value || confirmPwd.value;

  let hasError = false;

  if (isChangingName) {
    if (!isValidName(userName)) {
      hasError = true;
    } else {
      const success = await updateUserName(userName.value.trim());
      if (!success) {
        hasError = true;
      } else {
        setInputSuccess(userName);
      }
    }
  }

  if (isChangingPwd) {
    if (!validatePwdFields()) {
      hasError = true;
    } else {
      const success = await changePwd(currentPwd.value, newPwd.value);
      if (!success) {
        hasError = true;
      } else {
        setInputSuccess(currentPwd);
        setInputSuccess(newPwd);
        setInputSuccess(confirmPwd);
      }
    }
  }

  if (hasError) {
    return;
  }

  // 沒有要變更就退出編輯模式
  if (!isChangingName && !isChangingPwd) {
    resetEditMode();
    return;
  }

  // 成功後顯示並重置
  alert("資料更新成功");
  setTimeout(() => {
    resetEditMode();
  }, 1000);
}

function resetEditMode() {
  const editForm = document.querySelector(".edit-form");
  const editBtn = document.querySelector("#edit-btn");
  const cancelBtn = document.querySelector("#cancel-btn");
  const userName = document.querySelector("#user-name");
  const currentPwd = document.querySelector("#current-pwd");
  const newPwd = document.querySelector("#new-pwd");
  const confirmPwd = document.querySelector("#confirm-pwd");

  isEditing = false;
  editBtn.textContent = "編輯";

  if (cancelBtn) {
    cancelBtn.classList.add("is-hidden");
  }

  userName.setAttribute("readonly", true);
  currentPwd.setAttribute("readonly", true);
  newPwd.setAttribute("readonly", true);
  confirmPwd.setAttribute("readonly", true);

  currentPwd.value = "";
  newPwd.value = "";
  confirmPwd.value = "";
  clearFormInputErrors(editForm);
}

async function updateUserName(newName) {
  const currentUserName = document.querySelector(".user-data__name");
  const userName = document.querySelector("#user-name");

  try {
    const res = await fetch("/api/user/name", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        name: newName,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      if (result.error && result.message) {
        showInputMessage(userName, result.message);
      } else {
        showInputMessage(userName, "姓名變更失敗，請稍後再試");
      }
      return false;
    }

    currentUserData = result.data;
    currentUserName.textContent = result.data.name;

    return true;
  } catch (err) {
    console.error("更新姓名錯誤：", err);
    showInputMessage(userName, "系統錯誤，請稍後再試");
    return false;
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

    const tdCreatedAt = document.createElement("td");
    tdCreatedAt.textContent = formatDate(order.created_at || order.createdAt);
    tr.appendChild(tdCreatedAt);

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
