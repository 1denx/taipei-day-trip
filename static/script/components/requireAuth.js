import { getAuthHeader, logout, openAuthDialog } from "./auth.js";

let currentUser = null;

export async function requireAuth(mode) {
  const token = localStorage.getItem("token");

  if (!token) {
    handleUnauthed(mode);
    return false;
  }

  try {
    const res = await fetch("/api/user/auth", {
      headers: getAuthHeader(),
    });

    const result = await res.json();

    if (!result.data) {
      logout();
      handleUnauthed(mode);
      return false;
    }

    currentUser = result.data;
    return true;
  } catch (err) {
    logout();
    handleUnauthed(mode);
    return false;
  }
}

export function getCurrentUser() {
  return currentUser;
}

function handleUnauthed(mode) {
  if (mode === "redirect") {
    window.location.href = "/";
    return;
  }
  openAuthDialog();
}
