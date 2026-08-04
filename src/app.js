/**
 * Alt — Main Application Entry Point
 *
 * This file initializes all feature modules based on which page is currently loaded.
 * It uses Vite's dynamic imports to only load the modules needed for the current page.
 */

import { getSession, setSession, clearSession, login, logout, requireAuth, isLoginPage } from './lib/auth.js';
import { escapeHtml } from './lib/utils.js';

// Determine which page we are on and initialize accordingly
document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split("/").pop();

  // LOGIN PAGE
  if (currentPage === "login.html") {
    initLoginPage();
    return;
  }

  // All other pages require authentication
  if (!requireAuth()) return;

  // LOGOUT BUTTON (appears on multiple pages)
  const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("logoutBtnBoard");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      logout();
      logoutBtn.style.display = "none";
      window.location.href = "login.html";
    });
  }

  // Show logged-in user info on home page
  const welcomeUser = document.getElementById("welcomeUser");
  if (welcomeUser) {
    const ses = getSession();
    if (ses) {
      welcomeUser.innerHTML = `You're logged in as <b>${escapeHtml(ses.display)}</b>.<br>Have fun exploring!`;
      const ll = document.getElementById("loginLink");
      if (ll) ll.style.display = "none";
      const lb = document.getElementById("logoutBtn");
      if (lb) lb.style.display = "inline";
    }
  }

  // Initialize feature modules dynamically
  switch (currentPage) {
    case "index.html":
    case "":
      import("./features/countdown.js").then((mod) => mod.initCountdown());
      break;

    case "freedomboard.html":
      import("./features/board.js").then((mod) => mod.initBoard());
      break;

    case "contact.html":
      import("./features/contact.js").then((mod) => mod.initContact());
      break;

    case "gallery.html":
      import("./features/gallery.js").then((mod) => mod.initGallery());
      break;

    case "blog.html":
      import("./features/notes.js").then((mod) => mod.initNotes());
      break;

    case "chat.html":
      import("./features/chat.js").then((mod) => mod.initChat());
      break;

    case "countdown.html":
      import("./features/countdown.js").then((mod) => mod.initCountdown());
      break;
  }
});

/**
 * Initialize the login page.
 */
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMessage");

    const result = login(u, p);

    if (result.success) {
      msg.style.color = "#7f5fc3";
      msg.textContent = result.message;
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);
    } else {
      msg.style.color = "#e67fae";
      msg.textContent = result.message;
    }
  });
}
