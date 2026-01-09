export const showFormMessage = (form, message, type = "error") => {
  clearFormMsg(form);

  const msgEl = document.createElement("small");
  msgEl.classList.add("form-message", type);
  msgEl.innerText = message;

  form.appendChild(msgEl);

  setTimeout(() => {
    clearFormMsg(form);
    clearFormInputs(form);
  }, 2000);
};

export const clearFormMsg = (form) => {
  form.querySelectorAll(".form-message").forEach((el) => el.remove());
};

export const clearFormInputs = (form) => {
  form.querySelectorAll("input").forEach((input) => {
    input.value = "";
    input.classList.remove("error");
  });
};
