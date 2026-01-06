import { showFormMessage } from "./utils.js";

let authItem;
let logoutItem;
let dialog;
let signinModal;
let signupModal;
let signinForm;
let signupForm;
let signinEmailInput;
let signinPwdInput;
let signupNameInput;
let signupEmailInput;
let signupPwdInput;

function initAuth() {
  authItem = document.querySelector("#auth-item");
  logoutItem = document.querySelector("#logout-item");
  dialog = document.querySelector("#auth-dialog");
  signinModal = document.querySelector(".signin-modal");
  signupModal = document.querySelector(".signup-modal");
  signinForm = document.querySelector("#signin-form");
  signupForm = document.querySelector("#signup-form");
  signinEmailInput = document.querySelector("#signin-email");
  signinPwdInput = document.querySelector("#signin-pwd");
  signupNameInput = document.querySelector("#signup-name");
  signupEmailInput = document.querySelector("#signup-email");
  signupPwdInput = document.querySelector("#signup-pwd");

  const openAuth = document.querySelector("#open-auth");
  const logoutBtn = document.querySelector("#logout-btn");
  const signinBtn = document.querySelector("#signin-btn");
  const signupBtn = document.querySelector("#signup-btn");

  if (!openAuth || !logoutBtn || !dialog) {
    return;
  }

  openAuth.addEventListener("click", () => {
    resetAuthForms();
    dialog.showModal();
    signinModal.hidden = false;
    signupModal.hidden = true;
  });

  logoutBtn.addEventListener("click", () => {
    logout();
  });

  dialog.addEventListener("click", (e) => {
    const target = e.target.dataset.switch;
    if (!target) {
      if (e.target.closest(".close-btn") || e.target === dialog) {
        dialog.close();
      }
      return;
    }

    if (target === "signin") {
      resetAuthForms();
      signinModal.hidden = false;
      signupModal.hidden = true;
    }

    if (target === "signup") {
      resetAuthForms();
      signinModal.hidden = true;
      signupModal.hidden = false;
    }
  });

  signinBtn.addEventListener("click", handleSignin);
  signupBtn.addEventListener("click", handleSignup);

  checkAuthStatus();
}

// 等待 header 載入完成後再初始化
if (document.querySelector("#auth-dialog")) {
  initAuth();
} else {
  document.addEventListener("headerLoaded", () => {
    initAuth();
  });
}

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleSignup() {
  const name = signupNameInput.value.trim();
  const email = signupEmailInput.value.trim();
  const password = signupPwdInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !password) {
    showFormMessage(signupForm, "請輸入完整姓名、信箱與密碼");
    return;
  }

  if (!emailRegex.test(email)) {
    showFormMessage(signupForm, "請輸入正確的 Email");
    return;
  }

  if (password.length < 6) {
    showFormMessage(signupForm, "密碼長度至少 6 碼");
    return;
  }

  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showFormMessage(signupForm, data.message || "註冊失敗");
      return;
    }

    showFormMessage(signupForm, "註冊成功，請登入系統", "success");

    setTimeout(() => {
      signupModal.hidden = true;
      signinModal.hidden = false;
    }, 2000);
  } catch (err) {
    showFormMessage(signupForm, "系統錯誤，請稍後再試", "error");
  }
}

async function handleSignin() {
  const email = signinEmailInput.value.trim();
  const password = signinPwdInput.value.trim();

  if (!email || !password) {
    showFormMessage(signinForm, "請輸入電子信箱與密碼");
    return;
  }

  try {
    const res = await fetch("/api/user/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showFormMessage(signinForm, data.message || "信箱或密碼錯誤");
      return;
    }

    localStorage.setItem("token", data.token);
    dialog.close();
    checkAuthStatus();
  } catch (err) {
    showFormMessage(signinForm, "系統錯誤，請稍後再試", "error");
  }
}

async function checkAuthStatus() {
  try {
    const res = await fetch("/api/user/auth", {
      headers: { ...getAuthHeader() },
    });

    const result = await res.json();

    if (result.data === null) {
      logout();
      return;
    }

    updateAuthUI(result.data);
    console.log("已登入使用者：", result.data);
  } catch (err) {
    logout();
    console.error("檢查登入狀態失敗");
  }
}

function updateAuthUI(user) {
  if (user) {
    authItem.hidden = true;
    logoutItem.hidden = false;
  } else {
    authItem.hidden = false;
    logoutItem.hidden = true;
  }
}

function logout() {
  localStorage.removeItem("token");
  updateAuthUI(null);
  resetAuthForms();
}

function resetAuthForms() {
  signinForm.reset();
  signupForm.reset();
}
