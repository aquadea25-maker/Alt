import { supabase } from '../lib/supabase.js';
import { getSession, setSession } from '../lib/auth.js';
import { getProfile, getDisplayName } from '../lib/profile.js';
import { escapeHtml, formatDateTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

const BOARD_EMOJIS = ['❤️', '😊', '🥺', '😂', '🔥', '😍'];
let currentSession = null;

/**
 * Initialize the Freedom Board page.
 */
export function initBoard() {
  currentSession = getSession();

  const currentUserBoard = document.getElementById("currentUserBoard");
  if (currentUserBoard) {
    if (!currentSession) {
      window.location.href = "login.html";
      return;
    }
    const displayName = getDisplayName(currentSession.username);
    currentUserBoard.innerHTML = `You are <b>${escapeHtml(displayName)}</b>. Share your thoughts now!`;
    const lb = document.getElementById("logoutBtnBoard");
    if (lb) lb.style.display = "inline";
  }

  const boardForm = document.getElementById("boardForm");
  const boardNotesDiv = document.getElementById("boardNotes");
  if (boardForm && boardNotesDiv) {
    boardForm.addEventListener("submit", handleBoardSubmit);
    loadBoardNotes();
  }
}

/**
 * Handle Freedom Board form submission.
 */
async function handleBoardSubmit(e) {
  e.preventDefault();
  const ses = getSession();
  if (!ses) return;

  const text = document.getElementById("boardNote").value.trim();
  if (!text) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const profile = getProfile(ses.username);
  const displayName = profile?.display_name || ses.display;

  const { error } = await supabase.from("board_notes").insert({
    username: ses.username,
    display_name: displayName,
    text,
  });

  if (submitBtn) submitBtn.disabled = false;

  if (error) {
    console.error("Failed to post note:", error.message);
    return;
  }

  document.getElementById("boardNote").value = "";
  // Refetch after posting
  setTimeout(() => loadBoardNotes(), 300);
}

/**
 * Load all board notes from Supabase with reactions.
 */
async function loadBoardNotes() {
  const boardNotesDiv = document.getElementById("boardNotes");
  if (!boardNotesDiv) return;

  const ses = getSession();
  if (!ses) return;

  boardNotesDiv.innerHTML = "";
  boardNotesDiv.appendChild(createLoadingSpinner());

  const { data: notes, error } = await supabase
    .from("board_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    boardNotesDiv.innerHTML = "";
    boardNotesDiv.appendChild(
      createErrorDisplay("Could not load notes.", () => loadBoardNotes())
    );
    console.error(error.message);
    return;
  }

  if (!notes || notes.length === 0) {
    boardNotesDiv.innerHTML = "<p>No notes yet. Start the magic!</p>";
    return;
  }

  // Fetch likes (hearts)
  const noteIds = notes.map((n) => n.id);
  const { data: likes } = await supabase
    .from("note_likes")
    .select("note_id, liked_by")
    .in("note_id", noteIds);

  boardNotesDiv.innerHTML = "";

  notes.forEach((note) => {
    const noteLikes = (likes || []).filter((l) => l.note_id === note.id);
    const likeCount = noteLikes.length;
    const hasLiked = noteLikes.some((l) => l.liked_by === ses.username);

    // Use profile display name
    const displayName = getDisplayName(note.username) || note.display_name;
    const reactions = parseReactions(note.reactions);

    const block = document.createElement("div");
    block.className = "boardNoteBlock";
    block.innerHTML = `
      <span class="noteUser">${escapeHtml(displayName)}</span>
      <span class="noteTime">${formatDateTime(note.created_at)}</span>
      <p>${escapeHtml(note.text)}</p>
      <div class="note-reactions">
        ${renderReactions(reactions, note.id, ses.username)}
        <div class="note-emoji-picker">
          ${BOARD_EMOJIS.map((emoji) => `<button class="emoji-react-btn" data-note-id="${note.id}" data-emoji="${emoji}">${emoji}</button>`).join('')}
        </div>
      </div>
      <button class="noteLike ${hasLiked ? 'liked' : ''}" data-id="${note.id}">
        <span class="heart">&#10084;</span>
        <span class="likeCount">${likeCount}</span>
      </button>
      ${note.username === ses.username ? "<button class='noteDelete' data-id='" + note.id + "'>Delete</button>" : ""}
    `;
    boardNotesDiv.appendChild(block);
  });

  // Wire up emoji reaction buttons
  boardNotesDiv.querySelectorAll(".emoji-react-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const noteId = btn.getAttribute("data-note-id");
      const emoji = btn.getAttribute("data-emoji");
      await toggleBoardReaction(noteId, emoji, ses.username);
    });
  });

  // Wire up delete buttons
  boardNotesDiv.querySelectorAll(".noteDelete").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = btn.getAttribute("data-id");
      if (!confirm("Are you sure you want to delete this note?")) return;

      await supabase.from("note_likes").delete().eq("note_id", id);
      const { error } = await supabase.from("board_notes").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete note:", error.message);
        return;
      }
      loadBoardNotes();
    });
  });

  // Wire up like buttons (heart)
  boardNotesDiv.querySelectorAll(".noteLike").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const ses2 = getSession();
      if (!ses2) return;
      const id = btn.getAttribute("data-id");
      const hasLiked = btn.classList.contains("liked");

      if (hasLiked) {
        await supabase.from("note_likes").delete().eq("note_id", id).eq("liked_by", ses2.username);
      } else {
        const { error } = await supabase.from("note_likes").insert({ note_id: parseInt(id), liked_by: ses2.username });
        if (error?.code === "23505") return;
      }
      loadBoardNotes();
    });
  });
}

/**
 * Parse reactions from JSON string.
 */
function parseReactions(reactionsStr) {
  if (!reactionsStr) return [];
  try {
    return JSON.parse(reactionsStr);
  } catch {
    return [];
  }
}

/**
 * Render emoji reactions for a board note.
 */
function renderReactions(reactions, noteId, currentUsername) {
  if (!reactions || reactions.length === 0) return '';
  const counts = {};
  reactions.forEach((r) => {
    if (!counts[r.emoji]) counts[r.emoji] = 0;
    counts[r.emoji]++;
  });

  return '<div class="note-emoji-reactions">' +
    Object.entries(counts).map(([emoji, count]) => {
      const isMine = reactions.some((r) => r.emoji === emoji && r.user === currentUsername);
      return `<button class="note-emoji-badge ${isMine ? 'active' : ''}" data-note-id="${noteId}" data-emoji="${emoji}">${emoji} ${count}</button>`;
    }).join('') +
    '</div>';
}

/**
 * Toggle an emoji reaction on a board note.
 */
async function toggleBoardReaction(noteId, emoji, username) {
  const boardNotesDiv = document.getElementById("boardNotes");
  if (!boardNotesDiv) return;

  // Find the note in current notes to get current reactions
  const { data: notes, error } = await supabase
    .from("board_notes")
    .select("reactions")
    .eq("id", noteId)
    .single();

  if (error) {
    console.error("Failed to load reactions:", error.message);
    return;
  }

  const reactions = parseReactions(notes?.reactions);
  const existingIdx = reactions.findIndex(
    (r) => r.emoji === emoji && r.user === username
  );

  if (existingIdx >= 0) {
    reactions.splice(existingIdx, 1);
  } else {
    reactions.push({ emoji, user: username });
  }

  const { error: updateError } = await supabase
    .from("board_notes")
    .update({ reactions: JSON.stringify(reactions) })
    .eq("id", noteId);

  if (updateError) {
    console.error("Failed to update reactions:", updateError.message);
    return;
  }

  loadBoardNotes();
}
