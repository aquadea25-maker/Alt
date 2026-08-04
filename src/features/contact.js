import { supabase } from '../lib/supabase.js';
import { escapeHtml, formatDateTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

/**
 * Initialize the Contact page.
 */
export function initContact() {
  const contactForm = document.getElementById("contactForm");
  const contactInbox = document.getElementById("contactInbox");
  const contactSent = document.getElementById("contactSent");

  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
    loadContactMessages();
  }
}

/**
 * Handle contact form submission.
 * @param {Event} e
 */
async function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("contactName").value.trim();
  const msg = document.getElementById("contactMsg").value.trim();
  if (!name || !msg) return;

  const contactSent = document.getElementById("contactSent");
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const { error } = await supabase.from("contact_messages").insert({
    name,
    text: msg,
  });

  if (submitBtn) submitBtn.disabled = false;

  if (error) {
    if (contactSent) contactSent.textContent = "Could not send your message. Please try again.";
    console.error(error.message);
    return;
  }

  if (contactSent) contactSent.textContent = "Message sent! Scroll down to see it.";
  document.getElementById("contactName").value = "";
  document.getElementById("contactMsg").value = "";
  loadContactMessages();
}

/**
 * Load all contact messages from Supabase.
 */
async function loadContactMessages() {
  const contactInbox = document.getElementById("contactInbox");
  if (!contactInbox) return;

  contactInbox.innerHTML = "";
  contactInbox.appendChild(createLoadingSpinner());

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    contactInbox.innerHTML = "";
    contactInbox.appendChild(
      createErrorDisplay("Could not load messages.", () => loadContactMessages())
    );
    console.error(error.message);
    return;
  }

  contactInbox.innerHTML = "";
  if (data.length === 0) {
    return;
  }

  data.forEach((msg) => {
    const block = document.createElement("div");
    block.className = "boardNoteBlock";
    block.innerHTML = `
      <span class="noteUser">${escapeHtml(msg.name)}</span>
      <span class="noteTime">${formatDateTime(msg.created_at)}</span>
      <p>${escapeHtml(msg.text)}</p>
    `;
    contactInbox.appendChild(block);
  });
}
