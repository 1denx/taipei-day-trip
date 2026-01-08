import { getAuthHeader, logout, openAuthDialog } from "./auth.js";

let currentUser = null;

export async function requireAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    openAuthDialog();
    return false;
  }

  try {
    const res = await fetch("/api/user/auth", {
      headers: getAuthHeader(),
    });

    const result = await res.json();

    if (!result.data) {
      logout();
      openAuthDialog();
      return false;
    }

    currentUser = result.data;
    return true;
  } catch (err) {
    logout();
    openAuthDialog();
    return false;
  }
}

export function getCurrentUser() {
  return currentUser;
}
