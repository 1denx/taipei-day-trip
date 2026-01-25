let loadingEl = null;

function createLoading(text = "Loading...") {
  if (loadingEl) return;

  loadingEl = document.createElement("div");
  loadingEl.className = "loading-overlay";

  loadingEl.innerHTML = `
    <div class="loading-box">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <div class="loading-text">${text}</div>
    </div>
  `;

  document.body.appendChild(loadingEl);
}

export function showLoading(text) {
  createLoading(text);
  loadingEl.classList.remove("hidden");
}

export function hideLoading() {
  if (!loadingEl) return;
  loadingEl.classList.add("hidden");
}
