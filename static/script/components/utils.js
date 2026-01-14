// Form Message (dialog)
export function showFormMessage(form, message, type = "error") {
  clearFormMsg(form);

  form.querySelectorAll("input").forEach((input) => {
    input.classList.remove("error", "success");
    input.classList.add(type);
  });

  const msgEl = document.createElement("small");
  msgEl.classList.add("form-message", type);
  msgEl.innerText = message;

  form.appendChild(msgEl);

  setTimeout(() => {
    clearFormMsg(form);
    clearFormInputs(form);
  }, 2000);
}

export function clearFormMsg(form) {
  form.querySelectorAll(".form-message").forEach((el) => el.remove());
}

export function clearFormInputs(form) {
  form.querySelectorAll("input").forEach((input) => {
    input.value = "";
    input.classList.remove("error", "success");
  });
}

// Input Message (TapPay)
export function showInputMessage(input, message, type = "error") {
  clearInputMessage(input);

  input.classList.remove("success");
  input.classList.add(type);

  const parent = input.parentNode;
  if (parent) {
    parent.classList.remove("field-success", "field-error");
    parent.classList.add("field-error");
  }

  const msgEl = document.createElement("small");
  msgEl.classList.add("input-message", type);
  msgEl.innerText = message;

  input.parentNode.appendChild(msgEl);
}

// input 成功狀態
export function setInputSuccess(input) {
  clearInputMessage(input);
  input.classList.add("success");

  const parent = input.parentNode;
  if (parent) {
    parent.classList.remove("field-error");
    parent.classList.add("field-success");
  }
}

// 清除 input 訊息
export function clearInputMessage(input) {
  input.classList.remove("error", "success");

  const parent = input.parentNode;
  if (parent) {
    parent.classList.remove("field-error", "field-success");
  }

  const msgEl = input.parentNode.querySelector(".input-message");
  if (msgEl) msgEl.remove();
}

// 清除表單全部 input 錯誤
export function clearFormInputErrors(form) {
  form.querySelectorAll("input").forEach((input) => {
    clearInputMessage(input);
  });
}

// 驗證 name email phone
export function isValidName(input) {
  const value = input.value.trim();

  if (!value) {
    showInputMessage(input, "請輸入姓名");
    return false;
  }

  if (value.length < 2) {
    showInputMessage(input, "請至少輸入 2 個字元");
    return false;
  }
  setInputSuccess(input);
  return true;
}

export function isValidEmail(input) {
  const value = input.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value) {
    showInputMessage(input, "請輸入 Email");
    return false;
  }

  if (!emailRegex.test(value)) {
    showInputMessage(input, "Email 格式錯誤");
    return false;
  }
  setInputSuccess(input);
  return true;
}

export function isValidPhone(input) {
  const value = input.value.trim();
  const phoneRegex = /^09\d{8}$/;

  if (!value) {
    showInputMessage(input, "請輸入手機號碼");
    return false;
  }

  if (!phoneRegex.test(value)) {
    showInputMessage(input, "手機號碼格式錯誤");
    return false;
  }
  setInputSuccess(input);
  return true;
}

export function isValidForm(validations) {
  let isValid = true;

  validations.forEach(({ input, validator }) => {
    if (!validator(input)) {
      isValid = false;
    }
  });
  return isValid;
}
