import { supabase } from '../lib/supabase.js';
import { getSession } from '../lib/auth.js';
import { escapeHtml, formatTime, createLoadingSpinner, createErrorDisplay } from '../lib/utils.js';

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

    let loaded = false;
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
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      )
      .subscribe();

    // Clean up subscription on page unload
    window.addEventListener("beforeunload", function () {
      supabase.removeChannel(subscription);
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

      const { error } = await supabase.from("chat_messages").insert({
        sender: ses.username,
        display_name: ses.display,
        body: body,
      });

      if (submitBtn) submitBtn.disabled = false;

      if (error) {
        console.error(error.message);
        return;
      }

      chatInput.value = "";
    });
  }
}

/**
 * Load chat messages from Supabase.
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
    .limit(100);

  if (error) {
    chatBox.innerHTML = "";
    chatBox.appendChild(
      createErrorDisplay("Could not load messages.", () => loadChatMessages())
    );
    console.error(error.message);
    return;
  }

  chatBox.innerHTML = "";
  const ses = getSession();
  (messages || []).forEach((msg) => {
    appendChatMessage(msg, ses?.username || "");
  });
  chatBox.scrollTop = chatBox.scrollHeight;
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
  div.innerHTML = `
    ${!isMine ? "<div class='chat-sender'>" + escapeHtml(msg.display_name) + "</div>" : ""}
    <div>${escapeHtml(msg.body)}</div>
    <div class="chat-time">${formatTime(msg.created_at)}</div>
  `;
  chatBox.appendChild(div);
}
