/**
 * Authentication module for the Alt application.
 *
 * NOTE: For production use, this should be replaced with Supabase Auth
 * (supabase.auth.signInWithPassword / signInWithOtp) so that credentials
 * are never stored in client-side code. The current implementation uses
 * localStorage-based session management as a placeholder while credentials
 * remain client-managed.
 */

const STORAGE_KEY = "dreamyUser";

/** @type {Array<{username: string, password: string, display: string}>} */
const users = [
  { username: "melil", password: "gega083167", display: "Melil" },
  { username: "marlie", password: "ma071004", display: "Marlie" },
];

/**
 * Get the current session from localStorage.
 * @returns {{username: string, display: string} | null}
 */
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

/**
 * Save a session to localStorage.
 * @param {{username: string, password: string, display: string}} user
 */
export function setSession(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Clear the current session from localStorage.
 */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Attempt to log in with a username and password.
 * @param {string} username
 * @param {string} password
 * @returns {{ success: boolean, user?: {username: string, display: string}, message: string }}
 */
export function login(username, password) {
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();
  const found = users.find(
    (doc) => doc.username === trimmedUser && doc.password === trimmedPass
  );

  if (found) {
    const safeUser = { username: found.username, display: found.display };
    setSession({ username: found.username, password: found.password, display: found.display });
    return {
      success: true,
      user: safeUser,
      message: `Welcome, ${found.display}! Magical dream portal opening...`,
    };
  }

  return {
    success: false,
    message: "Oops! Wrong username or password.",
  };
}

/**
 * Log out the current user.
 */
export function logout() {
  clearSession();
}

/**
 * Redirect to login page if no session exists.
 * @returns {boolean} true if the user is logged in, false otherwise.
 */
export function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

/**
 * Check whether the current page is the login page.
 * @returns {boolean}
 */
export function isLoginPage() {
  return window.location.pathname.endsWith("login.html");
}
