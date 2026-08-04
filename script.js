import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Anniversary date — September 28, 2024
const ANNIVERSARY = new Date('2024-09-28T00:00:00');
const ANNIVERSARY_DAY = 28;

const users = [
    { username: "melil", password: "gega083167", display: "Melil" },
    { username: "marlie", password: "ma071004", display: "Marlie" }
];

function getSession() {
    return JSON.parse(localStorage.getItem("dreamyUser") || "null");
}
function setSession(user) {
    localStorage.setItem("dreamyUser", JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem("dreamyUser");
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", function () {
    // Redirect to login if not logged in (skip on login page itself)
    const isLoginPage = window.location.pathname.endsWith("login.html");
    if (!isLoginPage && !getSession()) {
        window.location.href = "login.html";
        return;
    }

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
                setTimeout(() => { window.location.href = "index.html"; }, 1200);
            } else {
                msg.style.color = "#e67fae";
                msg.textContent = "Oops! Wrong username or password.";
            }
        });
    }

    // LOGOUT BUTTON
    const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("logoutBtnBoard");
    if (logoutBtn) {
        logoutBtn.onclick = function (e) {
            e.preventDefault();
            clearSession();
            logoutBtn.style.display = "none";
            window.location.href = "login.html";
        };
    }

    // Show user if logged in (Home)
    const welcomeUser = document.getElementById("welcomeUser");
    if (welcomeUser) {
        const ses = getSession();
        if (ses) {
            welcomeUser.innerHTML = `You're logged in as <b>${ses.display}</b>.<br>Have fun exploring!`;
            const ll = document.getElementById("loginLink");
            if (ll) ll.style.display = "none";
            const lb = document.getElementById("logoutBtn");
            if (lb) lb.style.display = "inline";
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
        const lb = document.getElementById("logoutBtnBoard");
        if (lb) lb.style.display = "inline";
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
        const { data: notes, error } = await supabase
            .from("board_notes")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            boardNotesDiv.innerHTML = "<p>Could not load notes right now.</p>";
            console.error(error.message);
            return;
        }
        if (!notes || notes.length === 0) {
            boardNotesDiv.innerHTML = "<p>No notes yet. Start the magic!</p>";
            return;
        }
        const noteIds = notes.map(n => n.id);
        const { data: likes } = await supabase
            .from("note_likes")
            .select("note_id, liked_by")
            .in("note_id", noteIds);

        boardNotesDiv.innerHTML = "";
        notes.forEach(note => {
            const noteLikes = (likes || []).filter(l => l.note_id === note.id);
            const likeCount = noteLikes.length;
            const hasLiked = noteLikes.some(l => l.liked_by === ses.username);

            const block = document.createElement("div");
            block.className = "boardNoteBlock";
            block.innerHTML = `
                <span class="noteUser">${escapeHtml(note.display_name)}</span>
                <span class="noteTime">${new Date(note.created_at).toLocaleString()}</span>
                <p>${escapeHtml(note.text)}</p>
                <button class="noteLike ${hasLiked ? 'liked' : ''}" data-id="${note.id}">
                    <span class="heart">&#10084;</span>
                    <span class="likeCount">${likeCount}</span>
                </button>
                ${note.username === ses.username ? "<button class='noteDelete' data-id='" + note.id + "'>Delete</button>" : ""}
            `;
            boardNotesDiv.appendChild(block);
        });

        boardNotesDiv.querySelectorAll(".noteDelete").forEach(btn => {
            btn.onclick = async function () {
                const id = btn.getAttribute("data-id");
                await supabase.from("note_likes").delete().eq("note_id", id);
                const { error } = await supabase.from("board_notes").delete().eq("id", id);
                if (error) { console.error("Failed to delete note:", error.message); return; }
                showBoardNotes();
            };
        });

        boardNotesDiv.querySelectorAll(".noteLike").forEach(btn => {
            btn.onclick = async function () {
                const ses2 = getSession();
                const id = btn.getAttribute("data-id");
                const hasLiked = btn.classList.contains("liked");
                if (hasLiked) {
                    const { error } = await supabase
                        .from("note_likes")
                        .delete()
                        .eq("note_id", id)
                        .eq("liked_by", ses2.username);
                    if (error) { console.error(error.message); return; }
                } else {
                    const { error } = await supabase
                        .from("note_likes")
                        .insert({ note_id: parseInt(id), liked_by: ses2.username });
                    if (error) { console.error(error.message); return; }
                }
                showBoardNotes();
            };
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
        if (error) { contactInbox.innerHTML = ""; console.error(error.message); return; }
        contactInbox.innerHTML = data.length === 0 ? "" : data.map(msg =>
            `<div class="boardNoteBlock"><span class="noteUser">${escapeHtml(msg.name)}</span> <span class="noteTime">${new Date(msg.created_at).toLocaleString()}</span><p>${escapeHtml(msg.text)}</p></div>`
        ).join('');
    }

    // GALLERY: upload + display
    const galleryGrid = document.getElementById("galleryGrid");
    const uploadForm = document.getElementById("uploadForm");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxClose = document.querySelector(".lightbox-close");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const uploadMsg = document.getElementById("uploadMsg");

    if (uploadForm) {
        const ses = getSession();
        if (!ses) {
            uploadMsg.textContent = "Please log in to upload photos.";
        }
        uploadForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const ses = getSession();
            if (!ses) {
                uploadMsg.textContent = "Please log in first.";
                return;
            }
            const fileInput = document.getElementById("photoFile");
            const captionInput = document.getElementById("photoCaption");
            const file = fileInput.files[0];
            if (!file) return;

            uploadMsg.textContent = "Uploading...";
            const ext = file.name.split('.').pop();
            const fileName = `photo_${Date.now()}.${ext}`;
            const filePath = `${ses.username}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from("gallery-photos")
                .upload(filePath, file);

            if (uploadError) {
                uploadMsg.textContent = "Upload failed. Please try again.";
                console.error(uploadError.message);
                return;
            }

            const { data: urlData } = supabase
                .storage
                .from("gallery-photos")
                .getPublicUrl(filePath);

            const imageUrl = urlData.publicUrl;
            const caption = captionInput.value.trim();

            const { error: dbError } = await supabase.from("gallery_uploads").insert({
                uploaded_by: ses.username,
                display_name: ses.display,
                image_url: imageUrl,
                caption: caption
            });

            if (dbError) {
                uploadMsg.textContent = "Could not save photo info. Please try again.";
                console.error(dbError.message);
                return;
            }

            uploadMsg.textContent = "Photo uploaded!";
            fileInput.value = "";
            captionInput.value = "";
            loadGallery();
        });
    }

    if (galleryGrid) {
        loadGallery();
    }

    async function loadGallery() {
        const ses = getSession();
        const { data: photos, error } = await supabase
            .from("gallery_uploads")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error.message);
            return;
        }

        galleryGrid.innerHTML = "";

        // Default placeholder photos
        const defaults = [
            { image_url: "https://images.pexels.com/photos/30016033/pexels-photo-30016033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", caption: "A couple romantically embracing in an open field" },
            { image_url: "https://images.pexels.com/photos/1174958/pexels-photo-1174958.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", caption: "A couple enjoying a cozy moment on a park bench" },
            { image_url: "https://images.pexels.com/photos/29189812/pexels-photo-29189812.jpeg?auto=compress&cs=tinysrgb&h=650&w=940", caption: "A romantic couple embracing outdoors in warm sunlight" }
        ];

        const allPhotos = [...(photos || []).map(p => ({ ...p, isUpload: true })), ...defaults.map(d => ({ ...d, isUpload: false }))];

        allPhotos.forEach(photo => {
            const item = document.createElement("div");
            item.className = "gallery-item";
            const img = document.createElement("img");
            img.src = photo.image_url;
            img.alt = photo.caption || "Our photo";
            img.addEventListener("click", function () {
                if (lightbox) {
                    lightboxImg.src = img.src.replace('h=650&w=940', 'h=1200&w=1600');
                    lightboxImg.alt = img.alt;
                    if (lightboxCaption) lightboxCaption.textContent = photo.caption || "";
                    lightbox.classList.add("open");
                }
            });
            item.appendChild(img);

            if (photo.caption) {
                const cap = document.createElement("p");
                cap.className = "gallery-caption";
                cap.textContent = photo.caption;
                item.appendChild(cap);
            }

            if (photo.isUpload && ses && photo.uploaded_by === ses.username) {
                const del = document.createElement("button");
                del.className = "gallery-delete";
                del.innerHTML = "&times;";
                del.addEventListener("click", async function (e) {
                    e.stopPropagation();
                    await supabase.from("gallery_uploads").delete().eq("id", photo.id);
                    loadGallery();
                });
                item.appendChild(del);
            }

            galleryGrid.appendChild(item);
        });
    }

    if (lightbox && lightboxClose) {
        lightboxClose.addEventListener("click", function () {
            lightbox.classList.remove("open");
        });
        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox) lightbox.classList.remove("open");
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") lightbox.classList.remove("open");
        });
    }

    // LOVE NOTES: free-form writing
    const noteForm = document.getElementById("noteForm");
    const notesList = document.getElementById("notesList");
    const noteMsg = document.getElementById("noteMsg");

    if (noteForm) {
        const ses = getSession();
        if (!ses) {
            noteMsg.textContent = "Please log in to write love notes.";
        }
        loadLoveNotes();
        noteForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const ses = getSession();
            if (!ses) {
                noteMsg.textContent = "Please log in first.";
                return;
            }
            const title = document.getElementById("noteTitle").value.trim();
            const body = document.getElementById("noteBody").value.trim();
            if (!body) return;

            const { error } = await supabase.from("love_notes").insert({
                author: ses.username,
                display_name: ses.display,
                title: title,
                body: body
            });

            if (error) {
                noteMsg.textContent = "Could not save your note. Please try again.";
                console.error(error.message);
                return;
            }

            noteMsg.textContent = "Your love note has been posted!";
            document.getElementById("noteTitle").value = "";
            document.getElementById("noteBody").value = "";
            loadLoveNotes();
        });
    }

    async function loadLoveNotes() {
        if (!notesList) return;
        const ses = getSession();
        const { data: notes, error } = await supabase
            .from("love_notes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            notesList.innerHTML = "<p>Could not load love notes right now.</p>";
            console.error(error.message);
            return;
        }

        if (!notes || notes.length === 0) {
            notesList.innerHTML = "<p class='gallery-hint'>No love notes yet. Write the first one!</p>";
            return;
        }

        notesList.innerHTML = "";
        notes.forEach(note => {
            const block = document.createElement("div");
            block.className = "love-note";
            block.innerHTML = `
                ${note.title ? "<h3>" + escapeHtml(note.title) + "</h3>" : ""}
                <span class="note-author">From ${escapeHtml(note.display_name)}</span>
                <p class="note-body">${escapeHtml(note.body)}</p>
                <span class="date">${new Date(note.created_at).toLocaleString()}</span>
                ${ses && note.author === ses.username ? "<button class='note-delete-btn' data-id='" + note.id + "'>Delete</button>" : ""}
            `;
            notesList.appendChild(block);
        });

        notesList.querySelectorAll(".note-delete-btn").forEach(btn => {
            btn.onclick = async function () {
                const id = btn.getAttribute("data-id");
                const { error } = await supabase.from("love_notes").delete().eq("id", id);
                if (error) { console.error(error.message); return; }
                loadLoveNotes();
            };
        });
    }

    // CHAT: real-time messaging
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

        async function loadChatMessages() {
            const { data: messages, error } = await supabase
                .from("chat_messages")
                .select("*")
                .order("created_at", { ascending: true })
                .limit(100);

            if (error) {
                console.error(error.message);
                return;
            }

            chatBox.innerHTML = "";
            (messages || []).forEach(msg => {
                appendChatMessage(msg, ses.username);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
            loaded = true;
        }

        function appendChatMessage(msg, currentUsername) {
            const div = document.createElement("div");
            const isMine = msg.sender === currentUsername;
            div.className = "chat-msg " + (isMine ? "mine" : "theirs");
            div.innerHTML = `
                ${!isMine ? "<div class='chat-sender'>" + escapeHtml(msg.display_name) + "</div>" : ""}
                <div>${escapeHtml(msg.body)}</div>
                <div class="chat-time">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            chatBox.appendChild(div);
        }

        loadChatMessages();

        // Real-time subscription
        const subscription = supabase
            .channel("chat_messages_channel")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "chat_messages"
            }, (payload) => {
                if (!loaded) return;
                appendChatMessage(payload.new, ses.username);
                chatBox.scrollTop = chatBox.scrollHeight;
            })
            .subscribe();

        chatForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const body = chatInput.value.trim();
            if (!body) return;

            const { error } = await supabase.from("chat_messages").insert({
                sender: ses.username,
                display_name: ses.display,
                body: body
            });

            if (error) {
                console.error(error.message);
                return;
            }

            chatInput.value = "";
        });
    }

    // COUNTDOWN TIMER
    const timeTogether = document.getElementById("timeTogether");
    const nextMonthsarry = document.getElementById("nextMonthsarry");
    const homeCounter = document.getElementById("homeCounter");
    if (timeTogether || nextMonthsarry || homeCounter) {
        updateCounters();
        setInterval(updateCounters, 1000);
    }

    function updateCounters() {
        const now = new Date();
        if (timeTogether) {
            const diff = now - ANNIVERSARY;
            if (diff < 0) {
                timeTogether.innerHTML = "<p>Our journey hasn't started yet!</p>";
            } else {
                const days = Math.floor(diff / 86400000);
                const hours = Math.floor((diff % 86400000) / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                renderTimeGrid(timeTogether, [
                    { num: days, label: "Days" },
                    { num: hours, label: "Hours" },
                    { num: mins, label: "Minutes" },
                    { num: secs, label: "Seconds" }
                ]);
            }
        }
        if (nextMonthsarry) {
            const next = getNextMonthsarry(now);
            const diff = next - now;
            if (diff <= 0) {
                nextMonthsarry.innerHTML = "<p>It's our monthsarry today!</p>";
            } else {
                const days = Math.floor(diff / 86400000);
                const hours = Math.floor((diff % 86400000) / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                renderTimeGrid(nextMonthsarry, [
                    { num: days, label: "Days" },
                    { num: hours, label: "Hours" },
                    { num: mins, label: "Minutes" },
                    { num: secs, label: "Seconds" }
                ]);
            }
        }
        if (homeCounter) {
            const diff = now - ANNIVERSARY;
            if (diff >= 0) {
                const days = Math.floor(diff / 86400000);
                const hours = Math.floor((diff % 86400000) / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                renderTimeGrid(homeCounter, [
                    { num: days, label: "Days" },
                    { num: hours, label: "Hours" },
                    { num: mins, label: "Mins" },
                    { num: secs, label: "Secs" }
                ]);
            }
        }
    }

    function getNextMonthsarry(now) {
        const next = new Date(now.getFullYear(), now.getMonth(), ANNIVERSARY_DAY, 0, 0, 0);
        if (next <= now) {
            next.setMonth(next.getMonth() + 1);
        }
        return next;
    }

    function renderTimeGrid(container, units) {
        const existing = container.querySelectorAll(".time-num");
        container.innerHTML = units.map((u, i) => {
            const prevVal = existing[i] ? existing[i].textContent : "";
            const newVal = String(u.num).padStart(2, "0");
            const tickClass = prevVal !== "" && prevVal !== newVal ? "tick" : "";
            return `<div class="time-unit"><span class="time-num ${tickClass}">${newVal}</span><span class="time-label">${u.label}</span></div>`;
        }).join("");
    }
});
