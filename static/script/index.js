const selector = document.querySelector(".selector");
const trigger = selector.querySelector(".selector__trigger");
const options = selector.querySelectorAll("li");

trigger.addEventListener("click", () => {
  selector.classList.toggle("is-open");
});

options.forEach((option) => {
  option.addEventListener("click", () => {
    trigger.querySelector("span").textContent = option.textContent;
    selector.classList.remove("is-open");
  });
});

document.addEventListener("click", (e) => {
  if (!selector.contains(e.target)) {
    selector.classList.remove("is-open");
  }
});
