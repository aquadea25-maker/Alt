import { supabase } from '../lib/supabase.js';
import { getSession } from '../lib/auth.js';
import { getProfile } from '../lib/profile.js';
import { escapeHtml, formatTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

const PAGE_SIZE = 50; // Load 50 messages at a time
let allMessages = [];
let hasMore = false;
let loadingMore = false;
let loaded = false;

/**
 * Initialize the Chat page.
 */
export function initChat() {
  const chatBox = document.getElementById("chatBox");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  if (chatForm && chatBox) {
    const ses = getSession();
    if (!ses) {
      window.location.href = "login.html";
      return;
    }

    let lastSendTime = 0;
    const SEND_COOLDOWN = 1000; // 1 second between messages

    loadChatMessages();

    // Real-time subscription
    const subscription = supabase
      .channel("chat_messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          if (!loaded) return;
          appendChatMessage(payload.new, ses.username);
          scrollToBottom(chatBox);
        }
      )
      .subscribe();

    // Clean up subscription on page unload
    window.addEventListener("beforeunload", function () {
      supabase.removeChannel(subscription);
    });

    // Detect scroll-up to load older messages
    chatBox.addEventListener("scroll", function () {
      if (chatBox.scrollTop < 50 && hasMore && !loadingMore) {
        loadOlderMessages();
      }
    });

    chatForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const body = chatInput.value.trim();
      if (!body) return;

      // Rate limiting: prevent sending messages too fast
      const now = Date.now();
      if (now - lastSendTime < SEND_COOLDOWN) {
        return;
      }
      lastSendTime = now;

      const submitBtn = chatForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      // Use current profile display name (synced from profile)
      const profile = getProfile(ses.username);
      const displayName = profile?.display_name || ses.display;

      const { error } = await supabase.from("chat_messages").insert({
        sender: ses.username,
        display_name: displayName,
        body: body,
      });

      if (submitBtn) submitBtn.disabled = false;

      if (error) {
        console.error(error.message);
        return;
      }

      chatInput.value = "";
      chatInput.focus();
    });
  }
}

/**
 * Load the most recent batch of chat messages from Supabase.
 */
async function loadChatMessages() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  chatBox.innerHTML = "";
  chatBox.appendChild(createLoadingSpinner());

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(PAGE_SIZE);

  if (error) {
    chatBox.innerHTML = "";
    chatBox.appendChild(
      createErrorDisplay("Could not load messages.", () => loadChatMessages())
    );
    console.error(error.message);
    return;
  }

  allMessages = messages || [];
  chatBox.innerHTML = "";

  const ses = getSession();
  allMessages.forEach((msg) => {
    appendChatMessage(msg, ses?.username || "");
  });

  // Check if there are more messages to load
  if (allMessages.length >= PAGE_SIZE) {
    hasMore = true;
    addLoadMoreButton(chatBox);
  } else {
    hasMore = false;
  }

  scrollToBottom(chatBox);
  loaded = true;
}

/**
 * Load older messages (prepend to the top of the chat).
 */
async function loadOlderMessages() {
  if (loadingMore || !hasMore) return;
  loadingMore = true;

  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  // Show loading indicator at the top
  const loadMoreEl = document.getElementById("loadMoreBtn");
  if (loadMoreEl) {
    loadMoreEl.textContent = "Loading older messages...";
    loadMoreEl.disabled = true;
  }

  const oldestMessage = allMessages[0];
  if (!oldestMessage) {
    hasMore = false;
    removeLoadMoreButton();
    loadingMore = false;
    return;
  }

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .lt("created_at", oldestMessage.created_at)
    .order("created_at", { ascending: true })
    .limit(PAGE_SIZE);

  loadingMore = false;

  if (error) {
    console.error(error.message);
    if (loadMoreEl) {
      loadMoreEl.textContent = "Failed to load older messages";
    }
    return;
  }

  if (messages && messages.length > 0) {
    // Prepend older messages to the beginning
    allMessages = [...messages, ...allMessages];

    const ses = getSession();
    const newMessages = messages.reverse(); // oldest first
    newMessages.forEach((msg) => {
      prependChatMessage(msg, ses?.username || "");
    });

    // Maintain scroll position
    chatBox.scrollTop = newMessages.length * 60; // approximate height

    // Check if there are still more
    if (messages.length < PAGE_SIZE) {
      hasMore = false;
      removeLoadMoreButton();
      addEndOfChatMarker(chatBox);
    }
  } else {
    hasMore = false;
    removeLoadMoreButton();
    addEndOfChatMarker(chatBox);
  }

  if (loadMoreEl) loadMoreEl.remove();
}

/**
 * Append a single chat message to the chat box.
 * @param {{sender: string, display_name: string, body: string, created_at: string}} msg
 * @param {string} currentUsername
 */
function appendChatMessage(msg, currentUsername) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  const isMine = msg.sender === currentUsername;
  div.className = "chat-msg " + (isMine ? "mine" : "theirs");

  // Get the latest profile display name for this user
  const profile = getProfile(msg.sender);
  const displayName = profile?.display_name || msg.display_name || msg.sender;

  div.innerHTML = `
    ${!isMine ? "<div class='chat-sender'>" + escapeHtml(displayName) + "</div>" : ""}
    <div>${escapeHtml(msg.body)}</div>
    <div class="chat-time">${formatTime(msg.created_at)}</div>
  `;
  chatBox.appendChild(div);
}

/**
 * Prepend a single chat message to the top of the chat box.
 * @param {{sender: string, display_name: string, body: string, created_at: string}} msg
 * @param {string} currentUsername
 */
function prependChatMessage(msg, currentUsername) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  const isMine = msg.sender === currentUsername;
  div.className = "chat-msg " + (isMine ? "mine" : "theirs");

  const profile = getProfile(msg.sender);
  const displayName = profile?.display_name || msg.display_name || msg.sender;

  div.innerHTML = `
    ${!isMine ? "<div class='chat-sender'>" + escapeHtml(displayName) + "</div>" : ""}
    <div>${escapeHtml(msg.body)}</div>
    <div class="chat-time">${formatTime(msg.created_at)}</div>
  `;
  chatBox.insertBefore(div, chatBox.firstChild);
}

/**
 * Add a "Load older messages" button at the top of the chat.
 * @param {HTMLElement} chatBox
 */
function addLoadMoreButton(chatBox) {
  removeLoadMoreButton();
  const btn = document.createElement("button");
  btn.id = "loadMoreBtn";
  btn.className = "chat-load-more";
  btn.textContent = "Load older messages";
  btn.addEventListener("click", loadOlderMessages);
  chatBox.insertBefore(btn, chatBox.firstChild);
}

/**
 * Remove the load-more button if it exists.
 */
function removeLoadMoreButton() {
  const btn = document.getElementById("loadMoreBtn");
  if (btn) btn.remove();
}

/**
 * Add a marker showing we've reached the beginning of the chat.
 * @param {HTMLElement} chatBox
 */
function addEndOfChatMarker(chatBox) {
  const marker = document.createElement("div");
  marker.className = "chat-end-marker";
  marker.textContent = "Beginning of chat";
  chatBox.insertBefore(marker, chatBox.firstChild);
}

/**
 * Smooth scroll to the bottom of the chat box.
 * @param {HTMLElement} chatBox
 */
function scrollToBottom(chatBox) {
  requestAnimationFrame(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
