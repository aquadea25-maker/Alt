/**
 * Alt — Main Application Entry Point
 *
 * Initializes all feature modules based on which page is currently loaded.
 * Uses Vite's dynamic imports to only load the modules needed for the current page.
 */

import { getSession, setSession, clearSession, login, logout, register, requireAuth, getAllRegisteredUsers, isLoginPage } from './lib/auth.js';
import { escapeHtml } from './lib/utils.js';
import { injectSharedLayout } from './lib/nav.js';
import { getDisplayName } from './lib/profile.js';
import { initMusicPlayer } from './lib/music.js';
import { initSurpriseButton } from './lib/surprises.js';
import { saveProfile } from './lib/profile.js';

// Determine which page we are on and initialize accordingly
document.addEventListener("DOMContentLoaded", function () {
  // Inject shared navigation and footer on every page
  injectSharedLayout();

  const currentPage = window.location.pathname.split("/").pop();

  // LOGIN PAGE
  if (currentPage === "login.html") {
    // If already logged in, redirect to home
    if (getSession()) {
      window.location.href = "index.html";
      return;
    }
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
    });
  }

  // Show logged-in user info on home page
  const welcomeUser = document.getElementById("welcomeUser");
  if (welcomeUser) {
    const ses = getSession();
    if (ses) {
      const displayName = getDisplayName(ses.username);
      welcomeUser.innerHTML = `You're logged in as <b>${escapeHtml(displayName)}</b>.<br>Have fun exploring!`;
    }
  }

  // Initialize music player on all authenticated pages
  initMusicPlayer();

  // Initialize feature modules dynamically
  switch (currentPage) {
    case "index.html":
    case "":
      import("./features/countdown.js").then((mod) => mod.initCountdown());
      import("./lib/surprises.js").then((mod) => mod.initSurpriseButton());
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

    case "profile.html":
      import("./lib/profile.js").then((mod) => mod.initProfile());
      break;

    case "memories.html":
      import("./features/memories.js").then((mod) => mod.initMemories());
      break;
  }
});

/**
 * Initialize the login page with both login and signup forms.
 */
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const toggleBtn = document.getElementById("toggleAuthBtn");
  const togglePrompt = document.getElementById("togglePrompt");
  const accountList = document.getElementById("accountList");

  // Show available accounts
  renderAccountList(accountList);

  if (toggleBtn && togglePrompt) {
    let showingSignup = false;
    toggleBtn.addEventListener("click", function () {
      showingSignup = !showingSignup;
      if (showingSignup) {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
        togglePrompt.textContent = "Already have an account?";
        toggleBtn.textContent = "Sign In";
      } else {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
        togglePrompt.textContent = "New here?";
        toggleBtn.textContent = "Create an Account";
      }
      clearMessages();
    });
  }

  // Login handler
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value.trim();
      showLoginMessage(document.getElementById("loginMessage"));

      const result = login(u, p);

      if (result.success) {
        showLoginMessage(document.getElementById("loginMessage"), result.message, true);
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1200);
      } else {
        showLoginMessage(document.getElementById("loginMessage"), result.message, false);
      }
    });
  }

  // Signup handler
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value.trim();
      const displayName = document.getElementById("signupDisplayName").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();

      // Validation
      if (!username) {
        showLoginMessage(document.getElementById("loginMessage"), "Username is required.", false);
        return;
      }
      if (password.length < 4) {
        showLoginMessage(document.getElementById("loginMessage"), "Password must be at least 4 characters.", false);
        return;
      }
      if (password !== confirmPassword) {
        showLoginMessage(document.getElementById("loginMessage"), "Passwords do not match.", false);
        return;
      }

      const result = register(username, password, displayName || username);

      if (result.success) {
        showLoginMessage(document.getElementById("loginMessage"), result.message, true);

        // Save profile for the new user
        saveProfile(result.user.username, {
          display_name: displayName || username,
          avatar_url: "",
          bio: "",
        });

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        showLoginMessage(document.getElementById("loginMessage"), result.message, false);
      }
    });
  }
}

/**
 * Render the list of available accounts on the login page.
 */
function renderAccountList(container) {
  if (!container) return;
  const users = getAllRegisteredUsers();
  if (users.length === 0) return;

  container.innerHTML = `
    <h4>Available Accounts</h4>
    <div class="account-items">
      ${users.map((u) => `
        <button class="account-item" data-username="${escapeHtml(u.username)}">
          <span class="account-name">${escapeHtml(u.display)}</span>
        </button>
      `).join('')}
    </div>
  `;

  // Click to auto-fill username
  container.querySelectorAll(".account-item").forEach((btn) => {
    btn.addEventListener("click", function () {
      const username = btn.getAttribute("data-username");
      const usernameInput = document.getElementById("username");
      if (usernameInput) {
        usernameInput.value = username;
        document.getElementById("password")?.focus();
      }
    });
  });
}

/**
 * Show a login message.
 */
function showLoginMessage(el, message, isSuccess) {
  if (!el) return;
  if (message !== undefined) {
    el.textContent = message;
    el.style.color = isSuccess ? "#7f5fc3" : "#e67fae";
  } else {
    el.textContent = "";
  }
}

/**
 * Clear all login messages.
 */
function clearMessages() {
  const msg = document.getElementById("loginMessage");
  if (msg) {
    msg.textContent = "";
    msg.style.color = "";
  }
}
