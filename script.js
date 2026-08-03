import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User database (local only)
const users = [
    { username: "melil", password: "gega083167", display: "Melil" },
    { username: "marlie", password: "ma071004", display: "Marlie" }
];

// SESSION HANDLING
function getSession() {
    return JSON.parse(localStorage.getItem("dreamyUser") || "null");
}
function setSession(user) {
    localStorage.setItem("dreamyUser", JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem("dreamyUser");
}

document.addEventListener("DOMContentLoaded", function () {
    // LOGIN LOGIC
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const u = document.getElementById("username").value.trim();
            const p = document.getElementById("password").value.trim();
            let found = users.find(doc => doc.username === u && doc.password === p);
            const msg = document.getElementById("loginMessage");
            if (found) {
                setSession(found);
                msg.style.color = "#7f5fc3";
                msg.textContent = `Welcome, ${found.display}! Magical dream portal opening...`;
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1200);
            } else {
                msg.style.color = "#e67fae";
                msg.textContent = "Oops! Wrong username or password.";
            }
        });
    }

    // LOGOUT BUTTON
    const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("logoutBtnBoard");
    if (logoutBtn) {
        logoutBtn.onclick = function () {
            clearSession();
            logoutBtn.style.display = "none";
            window.location.href = "login.html";
        }
    }

    // Show user if logged in (Home)
    const welcomeUser = document.getElementById("welcomeUser");
    if (welcomeUser) {
        const ses = getSession();
        if (ses) {
            welcomeUser.innerHTML = `You're logged in as <b>${ses.display}</b>.<br>Have fun exploring! <a href="freedomboard.html">Go to Freedom Board</a>`;
            document.getElementById("loginLink").style.display = "none";
            document.getElementById("logoutBtn").style.display = "inline";
        }
    }

    // Freedom Board: show current user
    const currentUserBoard = document.getElementById("currentUserBoard");
    if (currentUserBoard) {
        const ses = getSession();
        if (!ses) {
            window.location.href = "login.html";
            return;
        }
        currentUserBoard.innerHTML = `You are <b>${ses.display}</b>. Share your thoughts now!`;
        document.getElementById("logoutBtnBoard").style.display = "inline";
    }

    // FREEDOM BOARD LOGIC
    const boardForm = document.getElementById("boardForm");
    const boardNotesDiv = document.getElementById("boardNotes");
    if (boardForm && boardNotesDiv) {
        showBoardNotes();
        boardForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const ses = getSession();
            const text = document.getElementById("boardNote").value.trim();
            if (!text) return;
            const { error } = await supabase.from("board_notes").insert({
                username: ses.username,
                display_name: ses.display,
                text
            });
            if (error) {
                console.error("Failed to post note:", error.message);
                return;
            }
            document.getElementById("boardNote").value = "";
            showBoardNotes();
        });
    }

    async function showBoardNotes() {
        const ses = getSession();
        const { data, error } = await supabase
            .from("board_notes")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            boardNotesDiv.innerHTML = "<p>Could not load notes right now.</p>";
            console.error(error.message);
            return;
        }
        boardNotesDiv.innerHTML = "";
        if (!data || data.length === 0) {
            boardNotesDiv.innerHTML = "<p>No notes yet. Start the magic!</p>";
            return;
        }
        data.forEach(note => {
            let block = document.createElement("div");
            block.className = "boardNoteBlock";
            block.innerHTML = `
                <span class="noteUser">${note.display_name}</span>
                <span class="noteTime">${new Date(note.created_at).toLocaleString()}</span>
                <p>${escapeHtml(note.text)}</p>
                ${note.username === ses.username ? "<button class='noteDelete' data-id='" + note.id + "'>Delete</button>" : ""}
            `;
            boardNotesDiv.appendChild(block);
        });
        boardNotesDiv.querySelectorAll(".noteDelete").forEach(btn => {
            btn.onclick = async function () {
                let id = btn.getAttribute("data-id");
                const { error } = await supabase.from("board_notes").delete().eq("id", id);
                if (error) {
                    console.error("Failed to delete note:", error.message);
                    return;
                }
                showBoardNotes();
            }
        });
    }

    // CONTACT FORM LOGIC
    const contactForm = document.getElementById("contactForm");
    const contactInbox = document.getElementById("contactInbox");
    const contactSent = document.getElementById("contactSent");
    if (contactForm) {
        contactForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const name = document.getElementById("contactName").value.trim();
            const msg = document.getElementById("contactMsg").value.trim();
            if (!name || !msg) return;
            const { error } = await supabase.from("contact_messages").insert({ name, text: msg });
            if (error) {
                contactSent.textContent = "Could not send your message. Please try again.";
                console.error(error.message);
                return;
            }
            contactSent.textContent = "Message sent! Scroll down to see it.";
            document.getElementById("contactName").value = "";
            document.getElementById("contactMsg").value = "";
            showContactInbox();
        });
        showContactInbox();
    }

    async function showContactInbox() {
        if (!contactInbox) return;
        const { data, error } = await supabase
            .from("contact_messages")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            contactInbox.innerHTML = "";
            console.error(error.message);
            return;
        }
        contactInbox.innerHTML = data.length === 0 ? "" : data.map(msg =>
            `<div class="boardNoteBlock"><span class="noteUser">${escapeHtml(msg.name)}</span> <span class="noteTime">${new Date(msg.created_at).toLocaleString()}</span><p>${escapeHtml(msg.text)}</p></div>`
        ).join('');
    }
});

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
