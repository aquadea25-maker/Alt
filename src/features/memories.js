/**
 * Shared Memories Timeline Feature
 *
 * A beautiful vertical timeline showing key moments in the couple's journey.
 * Memories can be added by either user and are stored in localStorage.
 */

import { getSession } from '../lib/auth.js';
import { getProfile } from '../lib/profile.js';
import { escapeHtml } from '../lib/utils.js';

const MEMORIES_KEY = "dreamyMemories";

/** Default memories if none exist */
const DEFAULT_MEMORIES = [
  {
    id: 1,
    title: "We met",
    date: "2024-09-28",
    description: "The day our story began.",
    addedBy: "system",
    emoji: "✨",
  },
  {
    id: 2,
    title: "First date",
    date: "2024-09-28",
    description: "Our very first adventure together.",
    addedBy: "system",
    emoji: "🌸",
  },
  {
    id: 3,
    title: "Official couple",
    date: "2024-09-28",
    description: "The day we made it official.",
    addedBy: "system",
    emoji: "💕",
  },
];

function getAllMemories() {
  try {
    const stored = JSON.parse(localStorage.getItem(MEMORIES_KEY) || "null");
    if (Array.isArray(stored)) return stored;
  } catch { /* ignore */ }
  saveMemories(DEFAULT_MEMORIES);
  return [...DEFAULT_MEMORIES];
}

function saveMemories(memories) {
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
}

/**
 * Initialize the Memories timeline page.
 */
export function initMemories() {
  const timeline = document.getElementById("timelineContainer");
  const addForm = document.getElementById("addMemoryForm");

  if (!timeline) return;

  const ses = getSession();
  if (!ses) {
    window.location.href = "login.html";
    return;
  }

  renderTimeline(timeline, ses.username);

  // Setup add memory form
  if (addForm) {
    addForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const title = document.getElementById("memoryTitle").value.trim();
      const date = document.getElementById("memoryDate").value;
      const description = document.getElementById("memoryDesc").value.trim();
      const emoji = document.getElementById("memoryEmoji").value.trim() || "✨";

      if (!title || !date || !description) return;

      const memories = getAllMemories();
      const newMemory = {
        id: Date.now(),
        title,
        date,
        description,
        addedBy: ses.username,
        emoji,
      };
      memories.push(newMemory);
      saveMemories(memories);

      // Clear form
      document.getElementById("memoryTitle").value = "";
      document.getElementById("memoryDate").value = "";
      document.getElementById("memoryDesc").value = "";
      document.getElementById("memoryEmoji").value = "✨";

      renderTimeline(timeline, ses.username);
    });
  }
}

/**
 * Render the timeline with all memories.
 */
function renderTimeline(container, currentUsername) {
  const memories = getAllMemories().sort((a, b) => new Date(a.date) - new Date(b.date));

  if (memories.length === 0) {
    container.innerHTML = '<p class="timeline-empty">No memories yet. Add your first one!</p>';
    return;
  }

  container.innerHTML = '<div class="timeline">' +
    memories.map((m) => {
      const profile = getProfile(m.addedBy);
      const displayName = m.addedBy === "system"
        ? "Us"
        : profile?.display_name || m.addedBy;
      const isMine = m.addedBy === currentUsername;

      return `
        <div class="timeline-item ${isMine ? 'mine' : ''}">
          <div class="timeline-dot">${m.emoji || '✨'}</div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h3>${escapeHtml(m.title)}</h3>
              <span class="timeline-date">${m.date}</span>
            </div>
            <p>${escapeHtml(m.description)}</p>
            <div class="timeline-meta">
              <span class="timeline-author">${escapeHtml(displayName)}</span>
              ${isMine ? `<button class="timeline-delete" data-id="${m.id}">Delete</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('') +
    '</div>';

  // Wire up delete buttons
  container.querySelectorAll(".timeline-delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = parseInt(btn.getAttribute("data-id"));
      if (!confirm("Delete this memory?")) return;
      const memories = getAllMemories().filter((m) => m.id !== id);
      saveMemories(memories);
      renderTimeline(container, currentUsername);
    });
  });
}
