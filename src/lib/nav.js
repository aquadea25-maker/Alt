import { getSession } from './auth.js';
import { getProfile } from './profile.js';

// Pages that are NOT main features (don't need a back button)
const MAIN_PAGES = ['index.html', 'login.html', ''];

/**
 * Build the navigation HTML string.
 * @param {string} currentPage - The current page filename (e.g., "index.html").
 * @returns {string} HTML string for the nav element.
 */
export function buildNav(currentPage) {
  const session = getSession();
  const isMainPage = MAIN_PAGES.includes(currentPage);

  const loginLinkStyle = session ? 'style="display:none"' : '';
  const logoutStyle = session ? '' : 'style="display:none"';
  const navStyle = session ? '' : 'style="display:none"';

  // Build profile section (avatar + display name)
  let profileHtml = '';
  if (session) {
    const profile = getProfile(session.username);
    const displayName = profile?.display_name || session.display || session.username;
    profileHtml = `
      <li class="nav-profile">
        <a href="profile.html" class="nav-profile-link" title="Edit Profile">
          <img src="${profile?.avatar_url || ''}" alt="${displayName}" class="nav-avatar"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2218%22 fill=%22%23bf8ad6%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2216%22>${displayName.charAt(0).toUpperCase()}</text></svg>'">
          <span class="nav-profile-name">${displayName}</span>
        </a>
      </li>`;
  }

  const navLinks = `
    <nav id="mainNav" ${navStyle}>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="freedomboard.html">Freedom Board</a></li>
        <li><a href="gallery.html">Gallery</a></li>
        <li><a href="blog.html">Love Notes</a></li>
        <li><a href="chat.html">Chat</a></li>
        <li><a href="countdown.html">Countdown</a></li>
        <li><a href="contact.html">Contact</a></li>
        ${profileHtml}
        <li><a href="#" id="logoutBtn" ${logoutStyle}>Logout</a></li>
      </ul>
    </nav>
    <nav class="login-nav" ${!session ? '' : 'style="display:none"'}>
      <ul>
        <li><a href="login.html" id="loginLink">Login</a></li>
      </ul>
    </nav>`;

  // Back button for non-main pages
  const backBtn = !isMainPage ? `
    <div class="page-back">
      <a href="index.html" class="back-button" title="Go back to Home">&larr; Back</a>
    </div>` : '';

  return navLinks + backBtn;
}

/**
 * Build the footer HTML string.
 * @returns {string} HTML string for the footer element.
 */
export function buildFooter() {
  return `<footer>
    <small>Made with all my heart for you. &copy; 2025</small>
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
