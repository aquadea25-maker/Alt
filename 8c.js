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

// LOGIN PAGE
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
                msg.textContent = `Welcome, ${found.display}! Magical dream portal opening... 🚀`;
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
        boardForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const ses = getSession();
            const text = document.getElementById("boardNote").value.trim();
            if (!text) return;
            let notes = JSON.parse(localStorage.getItem("freedomBoard") || "[]");
            notes.push({
                user: ses.display,
                username: ses.username,
                text,
                time: new Date().toLocaleString(),
                id: Date.now()
            });
            localStorage.setItem("freedomBoard", JSON.stringify(notes));
            document.getElementById("boardNote").value = "";
            showBoardNotes();
        });
    }

    function showBoardNotes() {
        const ses = getSession();
        let notes = JSON.parse(localStorage.getItem("freedomBoard") || "[]");
        boardNotesDiv.innerHTML = "";
        if (notes.length === 0) {
            boardNotesDiv.innerHTML = "<p>No notes yet. Start the magic!</p>";
            return;
        }
        notes.slice().reverse().forEach(note => {
            let block = document.createElement("div");
            block.className = "boardNoteBlock";
            block.innerHTML = `
                <span class="noteUser">${note.user}</span> 
                <span class="noteTime">${note.time}</span>
                <p>${note.text}</p>
                ${note.username === ses.username ? "<button class='noteDelete' data-id='"+note.id+"'>Delete</button>" : ""}
            `;
            boardNotesDiv.appendChild(block);
        });
        boardNotesDiv.querySelectorAll(".noteDelete").forEach(btn => {
            btn.onclick = function () {
                let id = btn.getAttribute("data-id");
                notes = notes.filter(n => n.id != id);
                localStorage.setItem("freedomBoard", JSON.stringify(notes));
                showBoardNotes();
            }
        });
    }

    // CONTACT FORM LOGIC
    const contactForm = document.getElementById("contactForm");
    const contactInbox = document.getElementById("contactInbox");
    const contactSent = document.getElementById("contactSent");
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("contactName").value.trim();
            const msg = document.getElementById("contactMsg").value.trim();
            if (!name || !msg) return;
            let inbox = JSON.parse(localStorage.getItem("contactInbox") || "[]");
            inbox.push({ user: name, text: msg, time: new Date().toLocaleString() });
            localStorage.setItem("contactInbox", JSON.stringify(inbox));
            contactSent.textContent = "Message sent! Scroll down to see it ❤️";
            document.getElementById("contactName").value = "";
            document.getElementById("contactMsg").value = "";
            showContactInbox();
        });
        showContactInbox();
    }

    function showContactInbox() {
        const inbox = JSON.parse(localStorage.getItem("contactInbox") || "[]").slice().reverse();
        if (contactInbox) {
            contactInbox.innerHTML = inbox.length === 0 ? "" : inbox.map(msg =>
                `<div class="boardNoteBlock"><span class="noteUser">${msg.user}</span> <span class="noteTime">${msg.time}</span><p>${msg.text}</p></div>`
            ).join('');
        }
    }
});