/**
 * Authentication module for the Alt application.
 *
 * Supports both local localStorage auth (for quick demo) and Supabase Auth
 * (for production). Account creation is freely available with username/password.
 * All registered users are stored in localStorage so they appear in partner lists.
 */

import { supabase } from './supabase.js';

const STORAGE_KEY = "dreamyUser";
const USERS_KEY = "dreamyRegisteredUsers";

/**
 * Get all registered users from localStorage.
 * Returns an array of {username, display} objects.
 */
export function getAllRegisteredUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || "null");
    if (Array.isArray(stored)) return stored;
  } catch { /* ignore */ }
  // Default users if none registered yet
  return [
    { username: "melil", display: "Melil", password: "password" },
    { username: "marlie", display: "Marlie", password: "password" },
  ];
}

/**
 * Register a new user.
 * @param {string} username
 * @param {string} password
 * @param {string} [displayName]
 * @returns {{ success: boolean, user?: {username: string, display: string}, message: string }}
 */
export function register(username, password, displayName) {
  const trimmedUser = username.trim().toLowerCase();
  const trimmedPass = password.trim();

  if (trimmedUser.length < 2) {
    return { success: false, message: "Username must be at least 2 characters." };
  }
  if (trimmedPass.length < 4) {
    return { success: false, message: "Password must be at least 4 characters." };
  }

  const users = getAllRegisteredUsers();
  if (users.find((u) => u.username === trimmedUser)) {
    return { success: false, message: "Username already taken. Try another one." };
  }

  const newUser = { username: trimmedUser, password: trimmedPass, display: displayName || trimmedUser };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const safeUser = { username: newUser.username, display: newUser.display };
  setSession({ username: newUser.username, password: newUser.password, display: newUser.display });
  return {
    success: true,
    user: safeUser,
    message: `Welcome, ${newUser.display}! Your account has been created!`,
  };
}

/**
 * Get the current session from localStorage.
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
 */
export function login(username, password) {
  const trimmedUser = username.trim().toLowerCase();
  const trimmedPass = password.trim();
  const users = getAllRegisteredUsers();
  const found = users.find(
    (u) => u.username === trimmedUser && u.password === trimmedPass
  );

  if (found) {
    const safeUser = { username: found.username, display: found.display };
    setSession({ username: found.username, password: found.password, display: found.display });
    return {
      success: true,
      user: safeUser,
      message: `Welcome back, ${found.display}!`,
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
  window.location.href = "login.html";
}

/**
 * Redirect to login page if no session exists.
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
 */
export function isLoginPage() {
  return window.location.pathname.endsWith("login.html");
}

/**
 * Get the list of usernames (for partner selection in chat).
 * Excludes the current user.
 */
export function getOtherUsers() {
  const session = getSession();
  if (!session) return [];
  return getAllRegisteredUsers().filter((u) => u.username !== session.username);
}
