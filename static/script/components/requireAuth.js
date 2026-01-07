import { getAuthHeader, logout, openAuthDialog } from "./auth.js";

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

    return true;
  } catch (err) {
    logout();
    openAuthDialog();
    return false;
  }
}
