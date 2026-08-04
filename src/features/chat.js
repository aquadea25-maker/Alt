import { supabase } from '../lib/supabase.js';
import { getSession, getOtherUsers } from '../lib/auth.js';
import { getProfile } from '../lib/profile.js';
import { escapeHtml, formatTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

const PAGE_SIZE = 50;
const EMOJI_REACTIONS = ['❤️', '😊', '😂', '🥺', '😍', '🔥'];

let allMessages = [];
let hasMore = false;
let loadingMore = false;
let loaded = false;
let selectedPartner = null;

/**
 * Initialize the Chat page.
 */
export function initChat() {
  const chatBox = document.getElementById("chatBox");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const partnerSelect = document.getElementById("partnerSelect");

  if (!chatForm || !chatBox) return;

  const ses = getSession();
  if (!ses) {
    window.location.href = "login.html";
    return;
  }

  // Setup partner selector
  setupPartnerSelector(partnerSelect, ses);

  let lastSendTime = 0;
  const SEND_COOLDOWN = 1000;

  // Load messages for the selected partner
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
        const msg = payload.new;
        // Only show if from selected partner or from self
        if (msg.sender === selectedPartner || msg.sender === ses.username) {
          appendChatMessage(msg, ses.username);
          scrollToBottom(chatBox);
        }
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
    if (!body || !selectedPartner) return;

    const now = Date.now();
    if (now - lastSendTime < SEND_COOLDOWN) return;
    lastSendTime = now;

    const submitBtn = chatForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const profile = getProfile(ses.username);
    const displayName = profile?.display_name || ses.display;

    const { error } = await supabase.from("chat_messages").insert({
      sender: ses.username,
      display_name: displayName,
      body: body,
      recipient: selectedPartner,
    });

    if (submitBtn) submitBtn.disabled = false;

    if (error) {
      console.error(error.message);
      return;
    }

    chatInput.value = "";
    chatInput.focus();
  });

  // Partner change handler
  if (partnerSelect) {
    partnerSelect.addEventListener("change", function () {
      selectedPartner = this.value;
      if (selectedPartner) {
        loadChatMessages();
      }
    });
  }
}

/**
 * Setup the partner selector dropdown.
 */
function setupPartnerSelector(selectEl, session) {
  if (!selectEl) return;
  const others = getOtherUsers();
  selectEl.innerHTML = '';

  if (others.length === 0) {
    selectEl.innerHTML = '<option value="" disabled selected>No other users yet</option>';
    return;
  }

  // Add "No partner" option
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'Select a partner...';
  selectEl.appendChild(noneOpt);

  // Add all other users
  others.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u.username;
    const profile = getProfile(u.username);
    const displayName = profile?.display_name || u.display || u.username;
    opt.textContent = displayName;
    selectEl.appendChild(opt);
  });

  // Auto-select if only one other user
  if (others.length === 1) {
    selectedPartner = others[0].username;
    selectEl.value = selectedPartner;
  }
}

/**
 * Load the most recent batch of chat messages.
 */
async function loadChatMessages() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  chatBox.innerHTML = "";
  chatBox.appendChild(createLoadingSpinner());

  const ses = getSession();
  if (!ses || !selectedPartner) {
    chatBox.innerHTML = '<p class="chat-empty">Select a partner to start chatting!</p>';
    loaded = true;
    return;
  }

  // Load messages between current user and selected partner
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .or(`sender.eq.${ses.username},sender.eq.${selectedPartner}`)
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

  // Show empty state if no messages
  if (allMessages.length === 0) {
    chatBox.innerHTML = '<p class="chat-empty">No messages yet. Say hi!</p>';
    loaded = true;
    return;
  }

  allMessages.forEach((msg) => {
    appendChatMessage(msg, ses.username);
  });

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
 * Load older messages.
 */
async function loadOlderMessages() {
  if (loadingMore || !hasMore) return;
  loadingMore = true;

  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

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

  const ses = getSession();
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .or(`sender.eq.${ses.username},sender.eq.${selectedPartner}`)
    .lt("created_at", oldestMessage.created_at)
    .order("created_at", { ascending: true })
    .limit(PAGE_SIZE);

  loadingMore = false;

  if (error) {
    console.error(error.message);
    if (loadMoreEl) loadMoreEl.textContent = "Failed to load older messages";
    return;
  }

  if (messages && messages.length > 0) {
    allMessages = [...messages, ...allMessages];

    const newMessages = messages.reverse();
    newMessages.forEach((msg) => {
      prependChatMessage(msg, ses?.username || "");
    });

    chatBox.scrollTop = newMessages.length * 60;

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
 */
function appendChatMessage(msg, currentUsername) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  const isMine = msg.sender === currentUsername;
  div.className = "chat-msg " + (isMine ? "mine" : "theirs");

  const profile = getProfile(msg.sender);
  const displayName = profile?.display_name || msg.display_name || msg.sender;
  const reactions = parseReactions(msg.reactions);

  div.innerHTML = `
    ${!isMine ? "<div class='chat-sender'>" + escapeHtml(displayName) + "</div>" : ""}
    <div>${escapeHtml(msg.body)}</div>
    ${renderReactions(reactions, msg.id)}
    <div class="chat-time">${formatTime(msg.created_at)}</div>
    <div class="chat-emoji-picker" data-msg-id="${msg.id}">
      ${EMOJI_REACTIONS.map((e) => `<button class="emoji-btn" data-emoji="${e}" data-msg-id="${msg.id}">${e}</button>`).join('')}
    </div>
  `;
  chatBox.appendChild(div);

  // Wire up emoji buttons
  div.querySelectorAll('.emoji-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const emoji = btn.getAttribute('data-emoji');
      const msgId = btn.getAttribute('data-msg-id');
      await toggleReaction(msgId, currentUsername, emoji);
    });
  });
}

/**
 * Prepend a single chat message to the top.
 */
function prependChatMessage(msg, currentUsername) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const div = document.createElement("div");
  const isMine = msg.sender === currentUsername;
  div.className = "chat-msg " + (isMine ? "mine" : "theirs");

  const profile = getProfile(msg.sender);
  const displayName = profile?.display_name || msg.display_name || msg.sender;
  const reactions = parseReactions(msg.reactions);

  div.innerHTML = `
    ${!isMine ? "<div class='chat-sender'>" + escapeHtml(displayName) + "</div>" : ""}
    <div>${escapeHtml(msg.body)}</div>
    ${renderReactions(reactions, msg.id)}
    <div class="chat-time">${formatTime(msg.created_at)}</div>
    <div class="chat-emoji-picker" data-msg-id="${msg.id}">
      ${EMOJI_REACTIONS.map((e) => `<button class="emoji-btn" data-emoji="${e}" data-msg-id="${msg.id}">${e}</button>`).join('')}
    </div>
  `;
  chatBox.insertBefore(div, chatBox.firstChild);

  div.querySelectorAll('.emoji-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const emoji = btn.getAttribute('data-emoji');
      const msgId = btn.getAttribute('data-msg-id');
      await toggleReaction(msgId, currentUsername, emoji);
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
 * Render emoji reactions for a message.
 */
function renderReactions(reactions, msgId) {
  if (!reactions || reactions.length === 0) return '';
  const counts = {};
  reactions.forEach((r) => {
    const key = `${r.emoji}_${r.user}`;
    if (!counts[r.emoji]) counts[r.emoji] = { total: 0, mine: false };
    counts[r.emoji].total++;
  });

  return '<div class="chat-reactions">' +
    Object.entries(counts).map(([emoji, info]) =>
      `<span class="reaction-badge" data-msg-id="${msgId}" data-emoji="${emoji}">${emoji} ${info.total}</span>`
    ).join('') +
    '</div>';
}

/**
 * Toggle an emoji reaction on a message.
 */
async function toggleReaction(msgId, username, emoji) {
  const msg = allMessages.find((m) => m.id == msgId);
  if (!msg) return;

  const reactions = parseReactions(msg.reactions);
  const existingIdx = reactions.findIndex(
    (r) => r.emoji === emoji && r.user === username
  );

  if (existingIdx >= 0) {
    reactions.splice(existingIdx, 1);
  } else {
    reactions.push({ emoji, user: username });
  }

  const { error } = await supabase
    .from("chat_messages")
    .update({ reactions: JSON.stringify(reactions) })
    .eq("id", msgId);

  if (error) {
    console.error("Failed to toggle reaction:", error.message);
    return;
  }

  // Update local state
  msg.reactions = JSON.stringify(reactions);

  // Refresh the chat to show updated reactions
  loadChatMessages();
}

/**
 * Add a "Load older messages" button.
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

function removeLoadMoreButton() {
  const btn = document.getElementById("loadMoreBtn");
  if (btn) btn.remove();
}

function addEndOfChatMarker(chatBox) {
  const marker = document.createElement("div");
  marker.className = "chat-end-marker";
  marker.textContent = "Beginning of chat";
  chatBox.insertBefore(marker, chatBox.firstChild);
}

function scrollToBottom(chatBox) {
  requestAnimationFrame(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
