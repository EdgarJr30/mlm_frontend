const FAKE_PASSWORD = "mlmprueba";
const TOKEN_KEY = "fake_auth_token";

export function login(password: string) {
  if (password === FAKE_PASSWORD) {
    localStorage.setItem(TOKEN_KEY, "LOGGED_IN");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return localStorage.getItem(TOKEN_KEY) === "LOGGED_IN";
}