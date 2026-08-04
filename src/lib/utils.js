/**
 * Escape HTML to prevent XSS attacks.
 * @param {string} str - The raw string to escape.
 * @returns {string} The HTML-escaped string.
 */
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format a date string into a localized display string.
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted date/time.
 */
export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString();
}

/**
 * Format a date string into a short time string.
 * @param {string} dateStr - ISO date string.
 * @returns {string} Formatted time (HH:MM).
 */
export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Create a loading spinner element.
 * @returns {HTMLDivElement} The spinner element.
 */
export function createLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.innerHTML = '<div class="spinner"></div><p class="loading-text">Loading...</p>';
  return spinner;
}

/**
 * Create a retry button element.
 * @param {Function} retryFn - The function to call on retry.
 * @returns {HTMLButtonElement} The retry button.
 */
export function createRetryButton(retryFn) {
  const btn = document.createElement("button");
  btn.className = "retry-btn";
  btn.textContent = "Retry";
  btn.addEventListener("click", retryFn);
  return btn;
}

/**
 * Create an error display with a retry option.
 * @param {string} message - The error message to display.
 * @param {Function} retryFn - The function to call on retry.
 * @returns {HTMLDivElement} The error element.
 */
export function createErrorDisplay(message, retryFn) {
  const wrapper = document.createElement("div");
  wrapper.className = "error-display";
  wrapper.innerHTML = `<p>${escapeHtml(message)}</p>`;
  wrapper.appendChild(createRetryButton(retryFn));
  return wrapper;
}
