import { getSession, isLoginPage } from './auth.js';
import { getDisplayName, getProfile } from './profile.js';
import { escapeHtml } from './utils.js';

// Pages that are NOT main features (don't need a back button)
const MAIN_PAGES = ['index.html', 'login.html', ''];

// All feature pages for nav links
const NAV_LINKS = [
  { href: "index.html", label: "Home" },
  { href: "freedomboard.html", label: "Board" },
  { href: "gallery.html", label: "Gallery" },
  { href: "blog.html", label: "Notes" },
  { href: "chat.html", label: "Chat" },
  { href: "countdown.html", label: "Countdown" },
  { href: "memories.html", label: "Memories" },
  { href: "contact.html", label: "Contact" },
  { href: "profile.html", label: "Profile" },
];

/**
 * Build the navigation HTML string.
 * @param {string} currentPage - The current page filename.
 * @returns {string} HTML string for the nav element.
 */
export function buildNav(currentPage) {
  const session = getSession();

  // Always show nav (even for login page, just minimal)
  const isMainPage = MAIN_PAGES.includes(currentPage);

  // Build profile section (avatar + display name)
  let profileHtml = '';
  if (session) {
    const profile = getProfile(session.username);
    const displayName = profile?.display_name || session.display || session.username;
    profileHtml = `
      <li class="nav-profile">
        <a href="profile.html" class="nav-profile-link" title="Edit Profile">
          ${profile?.avatar_url
            ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(displayName)}" class="nav-avatar">`
            : `<span class="nav-avatar-fallback">${displayName.charAt(0).toUpperCase()}</span>`
          }
          <span class="nav-profile-name">${escapeHtml(displayName)}</span>
        </a>
      </li>`;
  }

  // Build nav links
  const navLinks = NAV_LINKS.map((link) => {
    const isActive = link.href === currentPage ? ' class="active"' : '';
    return `<li><a href="${link.href}"${isActive}>${link.label}</a></li>`;
  }).join("");

  const navHtml = session
    ? `
    <nav id="mainNav">
      <button class="nav-hamburger" id="navHamburger" aria-label="Toggle navigation">&#9776;</button>
      <ul id="navMenu">
        ${navLinks}
        ${profileHtml}
        <li><a href="#" id="logoutBtn">Logout</a></li>
      </ul>
    </nav>`
    : `
    <nav class="login-nav">
      <ul>
        <li><a href="login.html">Login</a></li>
      </ul>
    </nav>`;

  // Back button for non-main pages
  const backBtn = !isMainPage ? `
    <div class="page-back">
      <a href="index.html" class="back-button" title="Go back to Home">&larr; Back</a>
    </div>` : '';

  return navHtml + backBtn;
}

/**
 * Build the footer HTML string.
 */
export function buildFooter() {
  return `<footer>
    <small>Made with all my heart for you. &copy; ${new Date().getFullYear()}</small>
</footer>`;
}

/**
 * Inject the shared nav and footer into a page that has placeholders.
 */
export function injectSharedLayout() {
  const navPlaceholder = document.getElementById("nav-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (navPlaceholder) {
    navPlaceholder.outerHTML = buildNav(currentPage);
  }
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = buildFooter();
  }
}
