import { supabase } from '../lib/supabase.js';
import { getSession, setSession } from '../lib/auth.js';
import { getProfile, getDisplayName } from '../lib/profile.js';
import { escapeHtml, formatDateTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

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
 * @param {Event} e
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
  // Optimistic UI update — add the note locally before refetching
  addNoteToBoard(ses.username, displayName, text);
}

/**
 * Add a note to the board DOM without refetching (optimistic update).
 * @param {string} username
 * @param {string} displayName
 * @param {string} text
 */
function addNoteToBoard(username, displayName, text) {
  const boardNotesDiv = document.getElementById("boardNotes");
  if (!boardNotesDiv) return;

  // Remove "No notes yet" message if present
  const placeholder = boardNotesDiv.querySelector("p");
  if (placeholder && boardNotesDiv.children.length === 1) {
    boardNotesDiv.innerHTML = "";
  }

  const block = document.createElement("div");
  block.className = "boardNoteBlock";
  const now = new Date();
  block.innerHTML = `
    <span class="noteUser">${escapeHtml(displayName)}</span>
    <span class="noteTime">${now.toLocaleString()}</span>
    <p>${escapeHtml(text)}</p>
    <button class="noteLike" data-id="new">
      <span class="heart">&#10084;</span>
      <span class="likeCount">0</span>
    </button>
    ${username === currentSession?.username ? "<button class='noteDelete' data-id='new'>Delete</button>" : ""}
  `;
  // Insert at the top
  boardNotesDiv.insertBefore(block, boardNotesDiv.firstChild);

  // Refetch after a short delay to sync with the server
  setTimeout(() => loadBoardNotes(), 500);
}

/**
 * Load all board notes from Supabase.
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

    // Use profile display name (fall back to stored display_name)
    const displayName = getDisplayName(note.username) || note.display_name;

    const block = document.createElement("div");
    block.className = "boardNoteBlock";
    block.innerHTML = `
      <span class="noteUser">${escapeHtml(displayName)}</span>
      <span class="noteTime">${formatDateTime(note.created_at)}</span>
      <p>${escapeHtml(note.text)}</p>
      <button class="noteLike ${hasLiked ? 'liked' : ''}" data-id="${note.id}">
        <span class="heart">&#10084;</span>
        <span class="likeCount">${likeCount}</span>
      </button>
      ${note.username === ses.username ? "<button class='noteDelete' data-id='" + note.id + "'>Delete</button>" : ""}
    `;
    boardNotesDiv.appendChild(block);
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

  // Wire up like buttons
  boardNotesDiv.querySelectorAll(".noteLike").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const ses2 = getSession();
      if (!ses2) return;
      const id = btn.getAttribute("data-id");
      const hasLiked = btn.classList.contains("liked");

      if (hasLiked) {
        const { error } = await supabase
          .from("note_likes")
          .delete()
          .eq("note_id", id)
          .eq("liked_by", ses2.username);
        if (error) {
          console.error(error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from("note_likes")
          .insert({ note_id: parseInt(id), liked_by: ses2.username });
        if (error) {
          console.error(error.message);
          if (error.code === "23505") {
            return; // Already liked, silently ignore
          }
          return;
        }
      }
      loadBoardNotes();
    });
  });
}
