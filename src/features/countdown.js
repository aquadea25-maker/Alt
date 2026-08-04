/**
 * Anniversary date constants.
 */
const ANNIVERSARY = new Date("2024-09-28T00:00:00");
const ANNIVERSARY_DAY = 28;

/**
 * Time unit configuration for rendering.
 * @typedef {{ num: number, label: string }} TimeUnit
 */

/**
 * Initialize the Countdown feature.
 * Sets up the timer interval and renders initial state.
 */
export function initCountdown() {
  const timeTogether = document.getElementById("timeTogether");
  const nextMonthsarry = document.getElementById("nextMonthsarry");
  const homeCounter = document.getElementById("homeCounter");

  if (timeTogether || nextMonthsarry || homeCounter) {
    updateCounters();
    setInterval(updateCounters, 1000);
  }
}

/**
 * Update all countdown displays.
 */
function updateCounters() {
  const now = new Date();
  const timeTogether = document.getElementById("timeTogether");
  const nextMonthsarry = document.getElementById("nextMonthsarry");
  const homeCounter = document.getElementById("homeCounter");

  if (timeTogether) {
    const diff = now - ANNIVERSARY;
    if (diff < 0) {
      timeTogether.innerHTML = "<p>Our journey hasn't started yet!</p>";
    } else {
      const units = calculateTimeUnits(diff);
      renderTimeGrid(timeTogether, units);
    }
  }

  if (nextMonthsarry) {
    const next = getNextMonthsarry(now);
    const diff = next - now;
    if (diff <= 0) {
      nextMonthsarry.innerHTML = "<p>It's our monthsarry today!</p>";
    } else {
      const units = calculateTimeUnits(diff);
      renderTimeGrid(nextMonthsarry, units);
    }
  }

  if (homeCounter) {
    const diff = now - ANNIVERSARY;
    if (diff >= 0) {
      const units = calculateTimeUnits(diff, true);
      renderTimeGrid(homeCounter, units);
    }
  }
}

/**
 * Calculate days, hours, minutes, seconds from a millisecond difference.
 * @param {number} diff - Millisecond difference.
 * @param {boolean} [shortLabels=false] - Use shorter labels for home counter.
 * @returns {Array<{num: number, label: string}>}
 */
function calculateTimeUnits(diff, shortLabels = false) {
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const labels = shortLabels
    ? { days: "Days", hours: "Hours", mins: "Mins", secs: "Secs" }
    : { days: "Days", hours: "Hours", mins: "Minutes", secs: "Seconds" };

  return [
    { num: days, label: labels.days },
    { num: hours, label: labels.hours },
    { num: mins, label: labels.mins },
    { num: secs, label: labels.secs },
  ];
}

/**
 * Get the next monthsarry date from now.
 * @param {Date} now - Current date.
 * @returns {Date} Next monthsarry date.
 */
function getNextMonthsarry(now) {
  const next = new Date(now.getFullYear(), now.getMonth(), ANNIVERSARY_DAY, 0, 0, 0);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

/**
 * Render time units into a container.
 * @param {HTMLElement} container
 * @param {Array<{num: number, label: string}>} units
 */
function renderTimeGrid(container, units) {
  const existing = container.querySelectorAll(".time-num");
  container.innerHTML = units
    .map((u, i) => {
      const prevVal = existing[i] ? existing[i].textContent : "";
      const newVal = String(u.num).padStart(2, "0");
      const tickClass = prevVal !== "" && prevVal !== newVal ? "tick" : "";
      return `<div class="time-unit"><span class="time-num ${tickClass}">${newVal}</span><span class="time-label">${u.label}</span></div>`;
    })
    .join("");
}
