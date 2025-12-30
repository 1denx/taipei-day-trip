const dialog = document.querySelector("#auth-dialog");
const openAuth = document.querySelector("#open-auth");
const signinModal = document.querySelector(".signin-modal");
const signupModal = document.querySelector(".signup-modal");
const closeBtn = document.querySelector(".close-btn");
const signinForm = document.querySelector("#signin-form");
const signupForm = document.querySelector("#signup-form");

openAuth.addEventListener("click", () => {
  dialog.showModal();
  signinModal.hidden = false;
  signupModal.hidden = true;
});

dialog.addEventListener("click", (e) => {
  const target = e.target.dataset.switch;
  if (!target) return;

  if (target === "signin") {
    signinModal.hidden = false;
    signupModal.hidden = true;
  }

  if (target === "signup") {
    signinModal.hidden = true;
    signupModal.hidden = false;
  }
});

dialog.addEventListener("click", (e) => {
  if (e.target.closest(".close-btn") || e.target === dialog) {
    dialog.close();
  }
});
