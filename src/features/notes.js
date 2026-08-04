import { supabase } from '../lib/supabase.js';
import { getSession } from '../lib/auth.js';
import { escapeHtml, formatDateTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

/**
 * Initialize the Love Notes page.
 */
export function initNotes() {
  const noteForm = document.getElementById("noteForm");
  const noteMsg = document.getElementById("noteMsg");

  if (noteForm) {
    const ses = getSession();
    if (!ses) {
      if (noteMsg) noteMsg.textContent = "Please log in to write love notes.";
    }

    noteForm.addEventListener("submit", handleNoteSubmit);
    loadLoveNotes();
  }
}

/**
 * Handle love note form submission.
 * @param {Event} e
 */
async function handleNoteSubmit(e) {
  e.preventDefault();
  const ses = getSession();
  if (!ses) {
    const noteMsg = document.getElementById("noteMsg");
    if (noteMsg) noteMsg.textContent = "Please log in first.";
    return;
  }

  const title = document.getElementById("noteTitle").value.trim();
  const body = document.getElementById("noteBody").value.trim();
  if (!body) return;

  const noteMsg = document.getElementById("noteMsg");
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const { error } = await supabase.from("love_notes").insert({
    author: ses.username,
    display_name: ses.display,
    title: title,
    body: body,
  });

  if (submitBtn) submitBtn.disabled = false;

  if (error) {
    if (noteMsg) noteMsg.textContent = "Could not save your note. Please try again.";
    console.error(error.message);
    return;
  }

  if (noteMsg) noteMsg.textContent = "Your love note has been posted!";
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteBody").value = "";
  loadLoveNotes();
}

/**
 * Load all love notes from Supabase.
 */
async function loadLoveNotes() {
  const notesList = document.getElementById("notesList");
  if (!notesList) return;

  const ses = getSession();
  notesList.innerHTML = "";
  notesList.appendChild(createLoadingSpinner());

  const { data: notes, error } = await supabase
    .from("love_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    notesList.innerHTML = "";
    notesList.appendChild(
      createErrorDisplay("Could not load love notes.", () => loadLoveNotes())
    );
    console.error(error.message);
    return;
  }

  if (!notes || notes.length === 0) {
    notesList.innerHTML = "<p class='gallery-hint'>No love notes yet. Write the first one!</p>";
    return;
  }

  notesList.innerHTML = "";
  notes.forEach((note) => {
    const block = document.createElement("div");
    block.className = "love-note";
    block.innerHTML = `
      ${note.title ? "<h3>" + escapeHtml(note.title) + "</h3>" : ""}
      <span class="note-author">From ${escapeHtml(note.display_name)}</span>
      <p class="note-body">${escapeHtml(note.body)}</p>
      <span class="date">${formatDateTime(note.created_at)}</span>
      ${ses && note.author === ses.username ? "<button class='note-delete-btn' data-id='" + note.id + "'>Delete</button>" : ""}
    `;
    notesList.appendChild(block);
  });

  // Wire up delete buttons
  notesList.querySelectorAll(".note-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = btn.getAttribute("data-id");
      if (!confirm("Are you sure you want to delete this love note?")) return;

      const { error } = await supabase.from("love_notes").delete().eq("id", id);
      if (error) {
        console.error(error.message);
        return;
      }
      loadLoveNotes();
    });
  });
}
