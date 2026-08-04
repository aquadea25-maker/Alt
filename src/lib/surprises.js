/**
 * Random Surprise Module
 *
 * Shows a random love quote or sweet message when triggered.
 * Can be activated from a button on the homepage.
 */

const LOVE_QUOTES = [
  "You are my favorite notification. 💌",
  "Every moment with you feels like a dream I never want to wake from. 🌙",
  "You make my heart do things it never knew it could. 💓",
  "In a world full of noise, you are my peace. 🕊️",
  "I fall in love with you a little more every single day. 🌸",
  "You are the poem I never knew how to write. 📝",
  "My favorite place in the world is wherever you are. 🌍",
  "You turned my ordinary days into something extraordinary. ✨",
  "I love you not only for what you are, but for what I am when I am with you. 💕",
  "You are the first thought in the morning and the last one at night. 🌅",
  "Being with you feels like coming home. 🏠",
  "You are my today and all of my tomorrows. 🌅",
  "I didn't know it was possible to love someone this much. 🥺",
  "You are the best thing that ever happened to me. 🌟",
  "My heart beats your name. 💗",
  "I love you more than words could ever express. 💌",
  "You are my forever and always. 💫",
  "With you, every day is a new adventure. 🗺️",
  "You are the reason I believe in happy endings. 📖",
  "I chose you and I will choose you every single day. 💍",
];

const SWEET_MESSAGES = [
  "Hey baby, just wanted you to know you're amazing. 🥰",
  "You make me smile even when I'm not around you. 😊",
  "I can't stop thinking about you. 💭",
  "You're the best part of my day. ☀️",
  "Just a reminder: you're incredibly loved. ❤️",
  "I'm so lucky to have you in my life. 🍀",
  "You make everything better just by being you. 🌸",
  "Can't wait to see you again. 💕",
  "You're my favorite person in the whole world. 🌎",
  "Life is so much better with you in it. 🎉",
];

/**
 * Show a random surprise message.
 * @param {HTMLElement} container - The element to display the message in.
 */
export function showRandomSurprise(container) {
  if (!container) return;

  const isQuote = Math.random() > 0.4;
  const pool = isQuote ? LOVE_QUOTES : SWEET_MESSAGES;
  const randomMsg = pool[Math.floor(Math.random() * pool.length)];

  // Animate in
  container.classList.add("surprise-active");
  container.textContent = randomMsg;

  // Remove animation class after animation
  setTimeout(() => {
    container.classList.remove("surprise-active");
  }, 500);
}

/**
 * Initialize the surprise button on the homepage.
 */
export function initSurpriseButton() {
  const btn = document.getElementById("surpriseBtn");
  const display = document.getElementById("surpriseDisplay");

  if (btn && display) {
    btn.addEventListener("click", () => {
      showRandomSurprise(display);
    });
  }
}
