import { getSession } from './auth.js';

/**
 * Build the navigation HTML string.
 * @param {string} currentPage - The current page filename (e.g., "index.html").
 * @returns {string} HTML string for the nav element.
 */
export function buildNav(currentPage) {
  const navItems = [
    { href: "index.html", label: "Home" },
    { href: "login.html", label: "Login", id: "loginLink" },
    { href: "freedomboard.html", label: "Freedom Board" },
    { href: "gallery.html", label: "Gallery" },
    { href: "blog.html", label: "Love Notes" },
    { href: "chat.html", label: "Chat" },
    { href: "countdown.html", label: "Countdown" },
    { href: "contact.html", label: "Contact" },
  ];

  const session = getSession();
  const loginLinkStyle = session ? 'style="display:none"' : '';
  const logoutStyle = session ? '' : 'style="display:none"';

  const items = navItems.map((item) => {
    const idAttr = item.id ? ` id="${item.id}"` : '';
    const styleAttr = item.id === "loginLink" ? loginLinkStyle : '';
    return `<li><a href="${item.href}"${idAttr}${styleAttr}>${item.label}</a></li>`;
  });

  return `<nav>
    <ul>
        ${items.join("\n        ")}
        <li><a href="#" id="logoutBtn" ${logoutStyle}>Logout</a></li>
    </ul>
</nav>`;
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
 * Usage: add <div id="nav-placeholder"></div> and <div id="footer-placeholder"></div>
 * to your HTML, then call injectSharedLayout().
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
